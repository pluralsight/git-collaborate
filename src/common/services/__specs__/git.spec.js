import { expect } from 'chai'
import fs from 'fs'
import path from 'path'

import { gitService as subject } from '../'
import * as exec from '../../utils/exec'
import sandbox from '../../../../test/sandbox'

describe('services/git', () => {
  let execResult

  beforeEach(() => {
    execResult = ''
    sandbox.stub(exec, 'execute').callsFake(() => execResult)
  })
  afterEach(() => {
    sandbox.restore()
  })

  describe('#setAuthor', () => {
    it('executes a git command to set author name and email', () => {
      subject.setAuthor('author-name', 'author-email')

      expect(exec.execute).to.have.been.calledWith('git config --global user.name "author-name"')
      expect(exec.execute).to.have.been.calledWith('git config --global user.email "author-email"')
    })
  })

  describe('#setCoAuthors', () => {
    it('executes a git command to set co-author(s)', () => {
      const coAuthors = [
        { name: 'co-author-1', email: 'co-author1@email.com' },
        { name: 'co-author-2', email: 'co-author-2@email.com' }
      ]
      const expectedCoAuthorValue = coAuthors
        .map((ca) => `Co-Authored-By: ${ca.name} <${ca.email}>`)
        .join(';')

      subject.setCoAuthors(coAuthors)

      expect(exec.execute).to.have.been.calledWith(`git config --global git-collab.co-authors "${expectedCoAuthorValue}"`)
    })

    it('sets empty co-author(s) when none are provided', () => {
      subject.setCoAuthors([])
      expect(exec.execute).to.have.been.calledWith('git config --global git-collab.co-authors ""')
    })
  })

  describe('#updateAuthorAndCoAuthors', () => {
    let users

    beforeEach(() => {
      sandbox.stub(subject, 'setAuthor')
      sandbox.stub(subject, 'setCoAuthors')

      users = [{
        name: 'First User',
        email: 'first@email.com',
        rsaKeyPath: '/not/a/real/path',
        active: true
      }, {
        name: 'Second User',
        email: 'second@email.com',
        rsaKeyPath: '/not/a/real/path',
        active: true
      }, {
        name: 'Third User',
        email: 'third@email.com',
        rsaKeyPath: '/not/a/real/path',
        active: true
      }, {
        name: 'Fourth User',
        email: 'fourth@email.com',
        rsaKeyPath: '/not/a/real/path',
        active: false
      }]
    })

    describe('when there is one active user', () => {
      it('sets the author and sets an empty co-author', () => {
        const user = users[0]

        subject.updateAuthorAndCoAuthors([user])

        expect(exec.execute).to.have.been.calledWith(`git config --global user.name "${user.name}"`)
        expect(exec.execute).to.have.been.calledWith(`git config --global user.email "${user.email}"`)
        expect(exec.execute).to.have.been.calledWith('git config --global git-collab.co-authors ""')
      })
    })

    describe('when there are two active users', () => {
      it('uses the first as author and second as co-author', () => {
        const author = users[0]
        const coAuthor = users[1]
        const expectedCoAuthorsConfig = `Co-Authored-By: ${coAuthor.name} <${coAuthor.email}>`

        subject.updateAuthorAndCoAuthors([author, coAuthor, users[3]])

        expect(exec.execute).to.have.been.calledWith(`git config --global user.name "${author.name}"`)
        expect(exec.execute).to.have.been.calledWith(`git config --global user.email "${author.email}"`)
        expect(exec.execute).to.have.been.calledWith(`git config --global git-collab.co-authors "${expectedCoAuthorsConfig}"`)
      })
    })

    describe('when there are three or more active users', () => {
      it('uses the first as author and all others as co-authors', () => {
        const coAuthors = users.filter((u) => u.active).slice(1)
        const expectedCoAuthorsConfig = coAuthors
          .map((ca) => `Co-Authored-By: ${ca.name} <${ca.email}>`)
          .join(';')

        subject.updateAuthorAndCoAuthors(users)

        expect(exec.execute).to.have.been.calledWith(`git config --global user.name "${users[0].name}"`)
        expect(exec.execute).to.have.been.calledWith(`git config --global user.email "${users[0].email}"`)
        expect(exec.execute).to.have.been.calledWith(`git config --global git-collab.co-authors "${expectedCoAuthorsConfig}"`)
      })
    })

    describe('when no users are active', () => {
      it('does nothing', () => {
        subject.updateAuthorAndCoAuthors([users[3]])

        expect(exec.execute).to.not.have.been.called
      })
    })
  })

  describe('#setGitLogAlias', () => {
    it('executes a git command to set the `git lg` alias', () => {
      subject.setGitLogAlias('path/to/git/log/script')
      expect(exec.execute).to.have.been.calledWith('git config --global alias.lg "!path/to/git/log/script"')
    })

    it('converts `\\` to `/`', () => {
      subject.setGitLogAlias('windows\\style\\path\\to\\git\\log\\script')
      expect(exec.execute).to.have.been.calledWith('git config --global alias.lg "!windows/style/path/to/git/log/script"')
    })
  })

  describe('#initRepo', () => {
    let repoPath
    let pathExists
    let repoExists
    let submoduleExists
    let isSubmoduleDir
    let postCommitExists
    let postCommitPath
    let postCommitGitCollabPath
    let gitHookPath

    beforeEach(() => {
      repoPath = '/repo/path'
      pathExists = true
      repoExists = true
      submoduleExists = false
      isSubmoduleDir = true
      postCommitExists = false
      postCommitPath = path.join(repoPath, '.git', 'hooks', 'post-commit')
      postCommitGitCollabPath = path.join(repoPath, '.git', 'hooks', 'post-commit.git-collab')
      gitHookPath = path.join(subject.GIT_COLLAB_PATH, 'post-commit')

      sandbox.stub(fs, 'existsSync')
        .withArgs(repoPath).callsFake(() => pathExists)
        .withArgs(path.join(repoPath, '.git')).callsFake(() => repoExists)
        .withArgs(path.join(repoPath, '.git', 'modules')).callsFake(() => submoduleExists)
        .withArgs(path.join(repoPath, '.git', 'hooks', 'post-commit')).callsFake(() => postCommitExists)
      sandbox.stub(fs, 'statSync').callsFake(() => ({ isDirectory: () => isSubmoduleDir }))
    })

    describe('when path is a git repo', () => {
      let existingPostCommitScript
      let gitHookContents

      beforeEach(() => {
        existingPostCommitScript = ''
        gitHookContents = '# do some git-collaborating'

        sandbox.stub(fs, 'readFileSync')
          .withArgs(postCommitPath).callsFake(() => existingPostCommitScript)
          .withArgs(gitHookPath).callsFake(() => gitHookContents)
        sandbox.stub(fs, 'writeFileSync')
      })

      it('copies the post-commit.git-collab file', () => {
        subject.initRepo(repoPath)

        expect(fs.readFileSync).to.have.been.calledWith(gitHookPath, 'utf-8')
        expect(fs.writeFileSync).to.have.been.calledWith(postCommitGitCollabPath, gitHookContents, { encoding: 'utf-8', mode: 0o755 })
      })

      it('writes post-commit file to call post-commit.git-collab', () => {
        subject.initRepo(repoPath)
        expect(fs.writeFileSync).to.have.been.calledWith(postCommitPath, subject.POST_COMMIT_BASE, { encoding: 'utf-8', mode: 0o755 })
      })

      it('returns true', () => {
        const success = subject.initRepo(repoPath)
        expect(success).to.be.true
      })

      describe('when post-commit already exists', () => {
        beforeEach(() => {
          postCommitExists = true
        })

        it('merges git-collab call into post-commit', () => {
          existingPostCommitScript = '#!/bin/bash\n\necho "Committed"'
          const expected = `${subject.POST_COMMIT_BASE}\n\necho "Committed"`

          const success = subject.initRepo(repoPath)

          expect(fs.writeFileSync).to.have.been.calledWith(postCommitPath, expected, { encoding: 'utf-8', mode: 0o755 })
          expect(success).to.be.true
        })
      })

      describe('when sub-modules exist', () => {
        let submoduleDirs
        let submoduleStatus
        let submodule1GitHooksPath
        let submodule2GitHooksPath
        let submodule3GitHooksPath

        beforeEach(() => {
          submoduleExists = true
          submoduleDirs = ['mod1', 'subdir/mod2', 'subdir/mod3']
          submoduleStatus = submoduleDirs
            .map((dir, i) => `${i % 2 === 0 ? '+' : ' '}rando-commit-hash ${dir} (current/branch)`)
            .join('\n') + '\n'
          submodule1GitHooksPath = path.join(repoPath, '.git', 'modules', 'mod1', 'hooks')
          submodule2GitHooksPath = path.join(repoPath, '.git', 'modules', 'subdir', 'mod2', 'hooks')
          submodule3GitHooksPath = path.join(repoPath, '.git', 'modules', 'subdir', 'mod2', 'hooks')

          execResult = submoduleStatus
        })

        it('installs post-commit files in sub-modules', () => {
          const success = subject.initRepo(repoPath)

          expect(fs.readFileSync).to.have.been.calledWith(gitHookPath, 'utf-8')
          expect(exec.execute).to.have.been.calledWith('git submodule status')

          expect(fs.writeFileSync).to.have.been.calledWith(path.join(submodule1GitHooksPath, 'post-commit.git-collab'), gitHookContents, { encoding: 'utf-8', mode: 0o755 })
          expect(fs.writeFileSync).to.have.been.calledWith(path.join(submodule1GitHooksPath, 'post-commit'), subject.POST_COMMIT_BASE, { encoding: 'utf-8', mode: 0o755 })

          expect(fs.writeFileSync).to.have.been.calledWith(path.join(submodule2GitHooksPath, 'post-commit.git-collab'), gitHookContents, { encoding: 'utf-8', mode: 0o755 })
          expect(fs.writeFileSync).to.have.been.calledWith(path.join(submodule2GitHooksPath, 'post-commit'), subject.POST_COMMIT_BASE, { encoding: 'utf-8', mode: 0o755 })

          expect(fs.writeFileSync).to.have.been.calledWith(path.join(submodule3GitHooksPath, 'post-commit.git-collab'), gitHookContents, { encoding: 'utf-8', mode: 0o755 })
          expect(fs.writeFileSync).to.have.been.calledWith(path.join(submodule3GitHooksPath, 'post-commit'), subject.POST_COMMIT_BASE, { encoding: 'utf-8', mode: 0o755 })

          expect(success).to.be.true
        })
      })
    })

    describe('when path does not exist', () => {
      it('return false', () => {
        pathExists = false
        expect(subject.initRepo(repoPath)).to.be.false
      })
    })

    describe('when path is not a git repo', () => {
      it('return false', () => {
        repoExists = false
        expect(subject.initRepo(repoPath)).to.be.false
      })
    })
  })

  describe('#removeRepo', () => {
    const postCommitGitCollab = '\n\n/bin/bash "$(dirname $0)"/post-commit.git-collab'
    let postCommitScript
    let repoPath
    let submoduleExists
    let postCommitExists
    let postCommitGitCollabExists
    let postCommitGitCollabPath

    beforeEach(() => {
      repoPath = '/repo/path'
      submoduleExists = false
      postCommitExists = true
      postCommitGitCollabExists = true
      postCommitScript = `#!/bin/bash${postCommitGitCollab}\n\necho "Committed"`
      postCommitGitCollabPath = path.join(repoPath, '.git', 'hooks', 'post-commit.git-collab')

      sandbox.stub(fs, 'existsSync')
        .withArgs(path.join(repoPath, '.git', 'modules')).callsFake(() => submoduleExists)
        .withArgs(path.join(repoPath, '.git', 'modules', 'mod1', 'hooks', 'post-commit.git-collab')).callsFake(() => submoduleExists)
        .withArgs(path.join(repoPath, '.git', 'modules', 'mod1', 'hooks', 'post-commit')).callsFake(() => submoduleExists)
        .withArgs(path.join(repoPath, '.git', 'modules')).callsFake(() => submoduleExists)
        .withArgs(path.join(repoPath, '.git', 'hooks', 'post-commit')).callsFake(() => postCommitExists)
        .withArgs(postCommitGitCollabPath).callsFake(() => postCommitGitCollabExists)
      sandbox.stub(fs, 'unlinkSync')
      sandbox.stub(fs, 'readFileSync').callsFake(() => postCommitScript)
      sandbox.stub(fs, 'writeFileSync')
    })

    it('deletes the post-commit.git-collab file', () => {
      subject.removeRepo(repoPath)
      expect(fs.unlinkSync).to.have.been.calledWith(postCommitGitCollabPath)
    })

    it('removes the git collab call in post-commit', () => {
      const expected = postCommitScript.replace(postCommitGitCollab, '')
      subject.removeRepo(repoPath)
      expect(fs.writeFileSync).to.have.been.calledWith(path.join(repoPath, '.git', 'hooks', 'post-commit'), expected, { encoding: 'utf-8', mode: 0o755 })
    })

    describe('when no other post-commit hooks exist', () => {
      it('deletes the post-commit hook', () => {
        postCommitScript = `#!/bin/bash${postCommitGitCollab}`
        subject.removeRepo(repoPath)
        expect(fs.unlinkSync).to.have.been.calledWith(postCommitGitCollabPath)
        expect(fs.unlinkSync).to.have.been.calledWith(path.join(repoPath, '.git', 'hooks', 'post-commit'))
      })
    })

    describe('when sub modules exist', () => {
      const submoduleDirs = ['mod1']

      beforeEach(() => {
        submoduleExists = true
        postCommitScript = `#!/bin/bash${postCommitGitCollab}`
        sandbox.stub(fs, 'readdirSync').callsFake(() => submoduleDirs)
      })

      it('removes post-commit files in sub-modules', () => {
        const submodule1GitHooksPath = path.join(repoPath, '.git', 'modules', 'mod1', 'hooks')

        subject.removeRepo(repoPath)

        expect(fs.unlinkSync).to.have.been.calledWith(path.join(submodule1GitHooksPath, 'post-commit.git-collab'))
        expect(fs.unlinkSync).to.have.been.calledWith(path.join(submodule1GitHooksPath, 'post-commit'))
      })
    })
  })
})

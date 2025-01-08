import { expect } from 'chai'
import fs from 'fs'
import path from 'path'

import { gitService as subject } from '../'
import * as exec from '../../utils/exec'
import sandbox from '../../../../test/sandbox'

describe('services/git', () => {
  afterEach(() => {
    sandbox.restore()
  })

  describe('#setAuthor', () => {
    beforeEach(() => {
      sandbox.stub(exec, 'execute')
    })

    it('executes a git command to set author name and email', () => {
      subject.setAuthor('author-name', 'author-email')

      expect(exec.execute).to.have.been.calledWith('git config --global user.name "author-name"')
      expect(exec.execute).to.have.been.calledWith('git config --global user.email "author-email"')
    })
  })

  describe('#setCoAuthors', () => {
    beforeEach(() => {
      sandbox.stub(exec, 'execute')
    })

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
      sandbox.stub(exec, 'execute')

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
    beforeEach(() => {
      sandbox.stub(exec, 'execute')
    })

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
    let repoHooksPath
    let localHooksPath
    let pathExists
    let repoExists
    let submoduleExists
    let submoduleStatus
    let isSubmoduleDir
    let postCommitExists
    let postCommitPath
    let postCommitGitCollabPath
    let gitHookPath

    beforeEach(() => {
      repoPath = '/repo/path'
      repoHooksPath = path.join(repoPath, '.git', 'hooks')
      localHooksPath = null
      pathExists = true
      repoExists = true
      submoduleExists = false
      isSubmoduleDir = true
      postCommitExists = false
      postCommitPath = path.join(repoHooksPath, 'post-commit')
      postCommitGitCollabPath = path.join(repoHooksPath, 'git-collab', 'post-commit')
      gitHookPath = path.join(subject.GIT_COLLAB_PATH, 'post-commit')

      sandbox.stub(fs, 'existsSync')
        .withArgs(repoPath).callsFake(() => pathExists)
        .withArgs(path.join(repoPath, '.git')).callsFake(() => repoExists)
        .withArgs(path.join(repoPath, '.git', 'modules')).callsFake(() => submoduleExists)
        .withArgs(path.join(repoHooksPath, 'post-commit')).callsFake(() => postCommitExists)
      sandbox.stub(fs, 'statSync').callsFake(() => ({ isDirectory: () => isSubmoduleDir }))
      sandbox.stub(exec, 'execute')
        .withArgs('git submodule status', { cwd: repoPath }).callsFake(() => submoduleStatus)
        .withArgs('git config --local core.hooksPath', { cwd: repoPath }).callsFake(() => {
          if (!localHooksPath) throw new Error()
          return `${localHooksPath}\n`
        })
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
        sandbox.stub(fs, 'mkdirSync')
      })

      it('creates the git-collab directory', () => {
        subject.initRepo(repoPath)
        expect(fs.mkdirSync).to.have.been.calledWith(path.join(repoHooksPath, 'git-collab'), { recursive: true })
      })

      it('copies the git-collab/post-commit file', () => {
        subject.initRepo(repoPath)

        expect(fs.readFileSync).to.have.been.calledWith(gitHookPath, 'utf-8')
        expect(fs.writeFileSync).to.have.been.calledWith(postCommitGitCollabPath, gitHookContents, { encoding: 'utf-8', mode: 0o755 })
      })

      it('writes post-commit file to call git-collab/post-commit', () => {
        subject.initRepo(repoPath)
        expect(fs.writeFileSync).to.have.been.calledWith(postCommitPath, subject.POST_COMMIT_BASE, { encoding: 'utf-8', mode: 0o755 })
      })

      it('returns valid', () => {
        const actual = subject.initRepo(repoPath)
        expect(actual).to.deep.equal({ hooksPath: repoHooksPath, isValid: true })
      })

      describe('when post-commit already exists', () => {
        beforeEach(() => {
          postCommitExists = true
        })

        it('merges git-collab call into post-commit', () => {
          existingPostCommitScript = '#!/bin/bash\n\necho "Committed"'
          const expected = `${subject.POST_COMMIT_BASE}\n\necho "Committed"`

          const actual = subject.initRepo(repoPath)

          expect(fs.writeFileSync).to.have.been.calledWith(postCommitPath, expected, { encoding: 'utf-8', mode: 0o755 })
          expect(actual).to.deep.equal({ hooksPath: repoHooksPath, isValid: true })
        })

        describe('when post-commit contains call to git-switch', () => {
          it('replaces git-switch hook with git-collab', () => {
            existingPostCommitScript = subject.GIT_SWITCH_POST_COMMIT_BASE
            sandbox.stub(fs, 'unlinkSync')

            const actual = subject.initRepo(repoPath)

            expect(fs.writeFileSync).to.have.been.calledWith(postCommitPath, subject.POST_COMMIT_BASE, { encoding: 'utf-8', mode: 0o755 })
            expect(fs.unlinkSync).to.have.been.calledWith(path.join(repoHooksPath, 'post-commit.git-switch'))
            expect(actual).to.deep.equal({ hooksPath: repoHooksPath, isValid: true })
          })
        })

        describe('when the post-commit contains old post-commit.git-collab', () => {
          it('replaces post-commit.git-collab hook with git-collab/post-commit', () => {
            existingPostCommitScript = subject.GIT_SWITCH_POST_COMMIT_BASE
            sandbox.stub(fs, 'unlinkSync')

            const actual = subject.initRepo(repoPath)

            expect(fs.writeFileSync).to.have.been.calledWith(postCommitPath, subject.POST_COMMIT_BASE, { encoding: 'utf-8', mode: 0o755 })
            expect(fs.unlinkSync).to.have.been.calledWith(path.join(repoHooksPath, 'post-commit.git-collab'))
            expect(actual).to.deep.equal({ hooksPath: repoHooksPath, isValid: true })
          })
        })
      })

      describe('when the repo has a local hooksPath', () => {
        beforeEach(() => {
          localHooksPath = '.some-tool/hooks'
          repoHooksPath = path.join(repoPath, '.some-tool', 'hooks')
        })

        it('uses the local hooksPath', () => {
          const actual = subject.initRepo(repoPath)

          expect(fs.readFileSync).to.have.been.calledWith(gitHookPath, 'utf-8')
          expect(exec.execute).to.have.been.calledWith('git config --local core.hooksPath', { cwd: repoPath })
          expect(fs.writeFileSync).to.have.been.calledWith(path.join(repoHooksPath, 'post-commit'), subject.POST_COMMIT_BASE, { encoding: 'utf-8', mode: 0o755 })
          expect(fs.writeFileSync).to.have.been.calledWith(path.join(repoHooksPath, 'git-collab', 'post-commit'), gitHookContents, { encoding: 'utf-8', mode: 0o755 })
          expect(actual).to.deep.equal({ hooksPath: repoHooksPath, isValid: true })
        })

        it('adds `.gitignore` to local `git-collab` directory', () => {
          const actual = subject.initRepo(repoPath)

          expect(fs.writeFileSync).to.have.been.calledWith(path.join(repoHooksPath, 'git-collab', '.gitignore'), '*', { encoding: 'utf-8' })
          expect(actual).to.deep.equal({ hooksPath: repoHooksPath, isValid: true })
        })

        describe('when the local hooksPath is .husky', () => {
          beforeEach(() => {
            localHooksPath = '.husky/_'
            repoHooksPath = path.join(repoPath, '.husky')
          })

          it('uses the .husky path', () => {
            const actual = subject.initRepo(repoPath)

            expect(fs.writeFileSync).to.have.been.calledWith(path.join(repoHooksPath, 'post-commit'), subject.POST_COMMIT_BASE, { encoding: 'utf-8', mode: 0o755 })
            expect(fs.writeFileSync).to.have.been.calledWith(path.join(repoHooksPath, 'git-collab', 'post-commit'), gitHookContents, { encoding: 'utf-8', mode: 0o755 })
            expect(fs.writeFileSync).to.have.been.calledWith(path.join(repoHooksPath, 'git-collab', '.gitignore'), '*', { encoding: 'utf-8' })
            expect(actual).to.deep.equal({ hooksPath: repoHooksPath, isValid: true })
          })
        })
      })

      describe('when sub-modules exist', () => {
        let submoduleDirs
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
        })

        it('installs post-commit files in sub-modules', () => {
          const actual = subject.initRepo(repoPath)

          expect(fs.readFileSync).to.have.been.calledWith(gitHookPath, 'utf-8')
          expect(exec.execute).to.have.been.calledWith('git submodule status')

          expect(fs.writeFileSync).to.have.been.calledWith(path.join(submodule1GitHooksPath, 'post-commit'), subject.POST_COMMIT_BASE, { encoding: 'utf-8', mode: 0o755 })
          expect(fs.writeFileSync).to.have.been.calledWith(path.join(submodule1GitHooksPath, 'git-collab', 'post-commit'), gitHookContents, { encoding: 'utf-8', mode: 0o755 })

          expect(fs.writeFileSync).to.have.been.calledWith(path.join(submodule2GitHooksPath, 'post-commit'), subject.POST_COMMIT_BASE, { encoding: 'utf-8', mode: 0o755 })
          expect(fs.writeFileSync).to.have.been.calledWith(path.join(submodule2GitHooksPath, 'git-collab', 'post-commit'), gitHookContents, { encoding: 'utf-8', mode: 0o755 })

          expect(fs.writeFileSync).to.have.been.calledWith(path.join(submodule3GitHooksPath, 'post-commit'), subject.POST_COMMIT_BASE, { encoding: 'utf-8', mode: 0o755 })
          expect(fs.writeFileSync).to.have.been.calledWith(path.join(submodule3GitHooksPath, 'git-collab', 'post-commit'), gitHookContents, { encoding: 'utf-8', mode: 0o755 })

          expect(actual).to.deep.equal({ hooksPath: repoHooksPath, isValid: true })
        })
      })
    })

    describe('when path does not exist', () => {
      it('return false', () => {
        pathExists = false
        expect(subject.initRepo(repoPath)).to.deep.equal({ isValid: false })
      })
    })

    describe('when path is not a git repo', () => {
      it('return invalid result', () => {
        repoExists = false
        expect(subject.initRepo(repoPath)).to.deep.equal({ isValid: false })
      })
    })
  })

  describe('#removeRepo', () => {
    const postCommitGitCollab = '\n\n[ -f "$(dirname $0)/git-collab/post-commit" ] && . $(dirname $0)/git-collab/post-commit'
    let postCommitScript
    let repoPath
    let repoHooksPath
    let submoduleExists
    let postCommitExists
    let postCommitGitCollabExists

    beforeEach(() => {
      repoPath = '/repo/path'
      repoHooksPath = path.join(repoPath, '.some-tool', 'hooks')
      submoduleExists = false
      postCommitExists = true
      postCommitGitCollabExists = true
      postCommitScript = `#!/usr/bin/env sh${postCommitGitCollab}\n\necho "Committed"`

      sandbox.stub(fs, 'existsSync')
        .withArgs(path.join(repoPath, '.git', 'modules')).callsFake(() => submoduleExists)
        .withArgs(path.join(repoPath, '.git', 'modules', 'mod1', 'hooks', 'post-commit')).callsFake(() => submoduleExists)
        .withArgs(path.join(repoPath, '.git', 'modules', 'mod1', 'hooks', 'git-collab')).callsFake(() => submoduleExists)
        .withArgs(path.join(repoHooksPath, 'post-commit')).callsFake(() => postCommitExists)
        .withArgs(path.join(repoHooksPath, 'git-collab')).callsFake(() => postCommitGitCollabExists)
      sandbox.stub(fs, 'readFileSync').callsFake(() => postCommitScript)
      sandbox.stub(fs, 'unlinkSync')
      sandbox.stub(fs, 'rmdirSync')
      sandbox.stub(fs, 'writeFileSync')
    })

    it('deletes the git-collab dir', () => {
      subject.removeRepo(repoPath, repoHooksPath)
      expect(fs.rmdirSync).to.have.been.calledWith(path.join(repoHooksPath, 'git-collab'))
    })

    it('removes the git collab call in post-commit', () => {
      const expected = postCommitScript.replace(postCommitGitCollab, '')
      subject.removeRepo(repoPath, repoHooksPath)
      expect(fs.writeFileSync).to.have.been.calledWith(path.join(repoHooksPath, 'post-commit'), expected, { encoding: 'utf-8', mode: 0o755 })
    })

    describe('when no other post-commit hooks exist', () => {
      beforeEach(() => {
        postCommitScript = `#!/usr/bin/env sh${postCommitGitCollab}`
      })

      it('deletes the post-commit hook', () => {
        subject.removeRepo(repoPath, repoHooksPath)
        expect(fs.unlinkSync).to.have.been.calledWith(path.join(repoHooksPath, 'post-commit'))
        expect(fs.rmdirSync).to.have.been.calledWith(path.join(repoHooksPath, 'git-collab'))
      })
    })

    describe('when sub modules exist', () => {
      const submoduleDirs = ['mod1']

      beforeEach(() => {
        repoHooksPath = path.join(repoPath, '.git', 'hooks')
        submoduleExists = true
        postCommitScript = `#!/usr/bin/env sh${postCommitGitCollab}`
        sandbox.stub(fs, 'readdirSync').callsFake(() => submoduleDirs)
      })

      it('removes post-commit files in sub-modules', () => {
        const submodule1GitHooksPath = path.join(repoPath, '.git', 'modules', 'mod1', 'hooks')

        subject.removeRepo(repoPath, repoHooksPath)

        expect(fs.unlinkSync).to.have.been.calledWith(path.join(submodule1GitHooksPath, 'post-commit'))
        expect(fs.rmdirSync).to.have.been.calledWith(path.join(submodule1GitHooksPath, 'git-collab'))
      })
    })
  })
})

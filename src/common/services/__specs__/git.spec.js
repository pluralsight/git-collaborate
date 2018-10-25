import { expect } from 'chai'
import fs from 'fs'
import path from 'path'
import { Readable, Writable } from 'stream'

import * as execute from '../../utils/exec'
import * as subject from '../git'
import sandbox from '../../../../test/sandbox'

describe('services/git', () => {
  let execResult

  beforeEach(() => {
    execResult = ''
    sandbox.stub(execute, 'default').callsFake(async () => execResult)
  })
  afterEach(() => {
    sandbox.restore()
  })

  describe('#setAuthor', () => {
    it('executes a git command to set author name and email', async () => {
      await subject.setAuthor('author-name', 'author-email')

      expect(execute.default).to.have.been.calledWith('git config --global user.name "author-name"')
      expect(execute.default).to.have.been.calledWith('git config --global user.email "author-email"')
    })
  })

  describe('#setCoAuthors', () => {
    it('executes a git command to set co-author(s)', async () => {
      const coAuthors = [
        { name: 'co-author-1', email: 'co-author1@email.com' },
        { name: 'co-author-2', email: 'co-author-2@email.com' }
      ]
      const expectedCoAuthorValue = coAuthors
        .map(ca => `Co-Authored-By: ${ca.name} <${ca.email}>`)
        .join(';')

      await subject.setCoAuthors(coAuthors)

      expect(execute.default).to.have.been.calledWith(`git config --global git-switch.co-authors "${expectedCoAuthorValue}"`)
    })

    it('sets empty co-author(s) when none are provided', async () => {
      await subject.setCoAuthors([])
      expect(execute.default).to.have.been.calledWith(`git config --global git-switch.co-authors ""`)
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
      it('sets the author and sets an empty co-author', async () => {
        const user = users[0]

        await subject.updateAuthorAndCoAuthors([user])

        expect(subject.setAuthor).to.have.been.calledWith(user.name, user.email)
        expect(subject.setCoAuthors).to.have.been.calledWith([])
      })
    })

    describe('when there are two active users', () => {
      it('uses the first as author and second as co-author', async () => {
        users = [users[0], users[1], users[3]]

        await subject.updateAuthorAndCoAuthors(users)

        expect(subject.setAuthor).to.have.been.calledWith(users[0].name, users[0].email)
        expect(subject.setCoAuthors).to.have.been.calledWith([users[1]])
      })
    })

    describe('when there are three or more active users', () => {
      it('uses the first as author and all others as co-authors', async () => {
        const activeUsers = users.filter(u => u.active).slice(1)

        await subject.updateAuthorAndCoAuthors(users)

        expect(subject.setAuthor).to.have.been.calledWith(users[0].name, users[0].email)
        expect(subject.setCoAuthors).to.have.been.calledWith(activeUsers)
      })
    })

    describe('when no users are active', () => {
      it('does nothing', async () => {
        await subject.updateAuthorAndCoAuthors([users[3]])

        expect(subject.setAuthor).to.not.have.been.called
        expect(subject.setCoAuthors).to.not.have.been.called
      })
    })
  })

  describe('#setGitLogAlias', () => {
    it('executes a git command to set the `git lg` alias', async () => {
      await subject.setGitLogAlias('path/to/git/log/script')
      expect(execute.default).to.have.been.calledWith('git config --global alias.lg "!path/to/git/log/script"')
    })

    it('converts `\\` to `/`', async () => {
      await subject.setGitLogAlias('windows\\style\\path\\to\\git\\log\\script')
      expect(execute.default).to.have.been.calledWith('git config --global alias.lg "!windows/style/path/to/git/log/script"')
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
    let postCommitGitSwitchPath

    beforeEach(() => {
      repoPath = '/repo/path'
      pathExists = true
      repoExists = true
      submoduleExists = false
      isSubmoduleDir = true
      postCommitExists = false
      postCommitPath = path.join(repoPath, '.git', 'hooks', 'post-commit')
      postCommitGitSwitchPath = path.join(repoPath, '.git', 'hooks', 'post-commit.git-switch')

      sandbox.stub(fs, 'existsSync')
        .withArgs(repoPath).callsFake(() => pathExists)
        .withArgs(path.join(repoPath, '.git')).callsFake(() => repoExists)
        .withArgs(path.join(repoPath, '.git', 'modules')).callsFake(() => submoduleExists)
        .withArgs(path.join(repoPath, '.git', 'hooks', 'post-commit')).callsFake(() => postCommitExists)
      sandbox.stub(fs, 'statSync').callsFake(() => ({ isDirectory: () => isSubmoduleDir }))
    })

    describe('when path is a git repo', () => {
      let existingPostCommitScript
      let readStream
      let writeStream
      const postCommitBuffer = []

      beforeEach(() => {
        existingPostCommitScript = ''
        readStream = new Readable({ read: () => true })
        writeStream = new Writable({
          write: (data, enc, cb) => {
            postCommitBuffer.push(data)
            cb()
          }
        })

        sandbox.stub(fs, 'readFileSync').callsFake(() => existingPostCommitScript)
        sandbox.stub(fs, 'writeFileSync')
        sandbox.stub(fs, 'createReadStream').callsFake(() => readStream)
        sandbox.stub(fs, 'createWriteStream').callsFake(() => writeStream)
      })

      it('copies the post-commit.git-switch file', async () => {
        await subject.initRepo(repoPath)
        readStream.emit('data', '123')
        expect(fs.createReadStream).to.have.been.calledWith(path.join(subject.GIT_SWITCH_PATH, 'post-commit'), 'utf-8')
        expect(fs.createWriteStream).to.have.been.calledWith(postCommitGitSwitchPath, { encoding: 'utf-8', mode: 0o755 })
        expect(postCommitBuffer.toString('utf-8')).to.eql('123')
      })

      it('writes post-commit file to call post-commit.git-switch', async () => {
        await subject.initRepo(repoPath)
        expect(fs.writeFileSync).to.have.been.calledWith(postCommitPath, subject.POST_COMMIT_BASE, { encoding: 'utf-8', mode: 0o755 })
      })

      describe('when post-commit already exists', () => {
        beforeEach(() => {
          postCommitExists = true
        })

        it('merges git-switch call into post-commit', async () => {
          existingPostCommitScript = '#!/bin/bash\n\necho "Committed"'
          const expected = `${subject.POST_COMMIT_BASE}\n\necho "Committed"`

          await subject.initRepo(repoPath)

          expect(fs.writeFileSync).to.have.been.calledWith(postCommitPath, expected, { encoding: 'utf-8', mode: 0o755 })
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

        it('installs post-commit files in sub-modules', async () => {
          await subject.initRepo(repoPath)

          expect(fs.createReadStream).to.have.been.calledWith(path.join(subject.GIT_SWITCH_PATH, 'post-commit'), 'utf-8')
          expect(execute.default).to.have.been.calledWith('git submodule status')

          expect(fs.createWriteStream).to.have.been.calledWith(path.join(submodule1GitHooksPath, 'post-commit.git-switch'), { encoding: 'utf-8', mode: 0o755 })
          expect(fs.writeFileSync).to.have.been.calledWith(path.join(submodule1GitHooksPath, 'post-commit'), subject.POST_COMMIT_BASE, { encoding: 'utf-8', mode: 0o755 })

          expect(fs.createWriteStream).to.have.been.calledWith(path.join(submodule2GitHooksPath, 'post-commit.git-switch'), { encoding: 'utf-8', mode: 0o755 })
          expect(fs.writeFileSync).to.have.been.calledWith(path.join(submodule2GitHooksPath, 'post-commit'), subject.POST_COMMIT_BASE, { encoding: 'utf-8', mode: 0o755 })

          expect(fs.createWriteStream).to.have.been.calledWith(path.join(submodule3GitHooksPath, 'post-commit.git-switch'), { encoding: 'utf-8', mode: 0o755 })
          expect(fs.writeFileSync).to.have.been.calledWith(path.join(submodule3GitHooksPath, 'post-commit'), subject.POST_COMMIT_BASE, { encoding: 'utf-8', mode: 0o755 })
        })
      })
    })

    describe('when path does not exist', () => {
      it('throws an error', () => {
        pathExists = false
        return expect(subject.initRepo(repoPath)).to.eventually.be.rejected
      })
    })

    describe('when path is not a git repo', () => {
      it('throws an error', () => {
        repoExists = false
        return expect(subject.initRepo(repoPath)).to.eventually.be.rejected
      })
    })
  })

  describe('#removeRepo', () => {
    const postCommitGitSwitch = '\n\n/bin/bash "$(dirname $0)"/post-commit.git-switch'
    let postCommitScript
    let repoPath
    let submoduleExists
    let postCommitExists
    let postCommitGitSwitchExists
    let postCommitGitSwitchPath

    beforeEach(() => {
      repoPath = '/repo/path'
      submoduleExists = false
      postCommitExists = true
      postCommitGitSwitchExists = true
      postCommitScript = `#!/bin/bash${postCommitGitSwitch}\n\necho "Committed"`
      postCommitGitSwitchPath = path.join(repoPath, '.git', 'hooks', 'post-commit.git-switch')

      sandbox.stub(fs, 'existsSync')
        .withArgs(path.join(repoPath, '.git', 'modules')).callsFake(() => submoduleExists)
        .withArgs(path.join(repoPath, '.git', 'modules', 'mod1', 'hooks', 'post-commit.git-switch')).callsFake(() => submoduleExists)
        .withArgs(path.join(repoPath, '.git', 'modules', 'mod1', 'hooks', 'post-commit')).callsFake(() => submoduleExists)
        .withArgs(path.join(repoPath, '.git', 'modules')).callsFake(() => submoduleExists)
        .withArgs(path.join(repoPath, '.git', 'hooks', 'post-commit')).callsFake(() => postCommitExists)
        .withArgs(postCommitGitSwitchPath).callsFake(() => postCommitGitSwitchExists)
      sandbox.stub(fs, 'unlinkSync')
      sandbox.stub(fs, 'readFileSync').callsFake(() => postCommitScript)
      sandbox.stub(fs, 'writeFileSync')
    })

    it('deletes the post-commit.git-switch file', () => {
      subject.removeRepo(repoPath)
      expect(fs.unlinkSync).to.have.been.calledWith(postCommitGitSwitchPath)
    })

    it('removes the git switch call in post-commit', () => {
      const expected = postCommitScript.replace(postCommitGitSwitch, '')
      subject.removeRepo(repoPath)
      expect(fs.writeFileSync).to.have.been.calledWith(path.join(repoPath, '.git', 'hooks', 'post-commit'), expected, { encoding: 'utf-8', mode: 0o755 })
    })

    describe('when no other post-commit hooks exist', () => {
      it('deletes the post-commit hook', () => {
        postCommitScript = `#!/bin/bash${postCommitGitSwitch}`
        subject.removeRepo(repoPath)
        expect(fs.unlinkSync).to.have.been.calledWith(postCommitGitSwitchPath)
        expect(fs.unlinkSync).to.have.been.calledWith(path.join(repoPath, '.git', 'hooks', 'post-commit'))
      })
    })

    describe('when sub modules exist', () => {
      const submoduleDirs = ['mod1']

      beforeEach(() => {
        submoduleExists = true
        postCommitScript = `#!/bin/bash${postCommitGitSwitch}`
        sandbox.stub(fs, 'readdirSync').callsFake(() => submoduleDirs)
      })

      it('removes post-commit files in sub-modules', () => {
        const submodule1GitHooksPath = path.join(repoPath, '.git', 'modules', 'mod1', 'hooks')

        subject.removeRepo(repoPath)

        expect(fs.unlinkSync).to.have.been.calledWith(path.join(submodule1GitHooksPath, 'post-commit.git-switch'))
        expect(fs.unlinkSync).to.have.been.calledWith(path.join(submodule1GitHooksPath, 'post-commit'))
      })
    })
  })
})

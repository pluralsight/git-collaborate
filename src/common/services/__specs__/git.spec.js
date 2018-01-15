import { expect } from 'chai'
import fs from 'fs'
import path from 'path'
import * as sinon from 'sinon'
import { Readable, Writable } from 'stream'

import * as execute from '../../utils/exec'
import * as subject from '../git'

describe('services/git', () => {
  beforeEach(() => {
    sinon.stub(execute, 'default')
  })
  afterEach(() => {
    execute.default.restore()
  })

  describe('#setAuthor', () => {
    it('executes a git command to set author name and email', async () => {
      await subject.setAuthor('author-name', 'author-email')

      expect(execute.default).to.have.been.calledWith('git config --global author.name "author-name"')
      expect(execute.default).to.have.been.calledWith('git config --global author.email "author-email"')
    })
  })

  describe('#setCommitter', () => {
    it('executes a git command to set committer name and email', async () => {
      await subject.setCommitter('committer-1 & committer-2', 'committer-1, committer-2')

      expect(execute.default).to.have.been.calledWith('git config --global user.name "committer-1 & committer-2"')
      expect(execute.default).to.have.been.calledWith('git config --global user.email "committer-1, committer-2"')
    })
  })

  describe('#updateAuthorAndCommitter', () => {
    let users

    beforeEach(() => {
      sinon.stub(subject, 'setAuthor')
      sinon.stub(subject, 'setCommitter')

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

    afterEach(() => {
      subject.setAuthor.restore()
      subject.setCommitter.restore()
    })

    describe('when this is one active user', () => {
      it('uses one user as author and committer', async () => {
        const user = users[0]

        await subject.updateAuthorAndCommitter([user])

        expect(subject.setAuthor).to.have.been.calledWith(user.name, user.email)
        expect(subject.setCommitter).to.have.been.calledWith(user.name, user.email)
      })
    })

    describe('when there are two active users', () => {
      it('uses the first as author and second as committer', async () => {
        users = [users[0], users[1], users[3]]

        await subject.updateAuthorAndCommitter(users)

        expect(subject.setAuthor).to.have.been.calledWith(users[0].name, users[0].email)
        expect(subject.setCommitter).to.have.been.calledWith(users[1].name, users[1].email)
      })
    })

    describe('when there are three or more active users', () => {
      it('uses the first as author and all others as committer', async () => {
        const activeUsers = users.filter(u => u.active).slice(1)
        const committerName = activeUsers.map(u => u.name).join(' & ')
        const committerEmail = activeUsers.map(u => u.email).join(', ')

        await subject.updateAuthorAndCommitter(users)

        expect(subject.setAuthor).to.have.been.calledWith(users[0].name, users[0].email)
        expect(subject.setCommitter).to.have.been.calledWith(committerName, committerEmail)
      })
    })

    describe('when no users are active', () => {
      it('returns empty', async () => {
        const expected = {
          author: { name: '', email: '' },
          committer: { name: '', email: '' }
        }

        const actual = await subject.updateAuthorAndCommitter([users[3]])

        expect(actual).to.eql(expected)
      })
    })
  })

  describe('#initRepo', () => {
    let repoPath
    let pathExists
    let repoExists
    let submoduleExists
    let postCommitExists
    let postCommitPath
    let postCommitGitSwitchPath

    beforeEach(() => {
      repoPath = '/repo/path'
      pathExists = true
      repoExists = true
      submoduleExists = false
      postCommitExists = false
      postCommitPath = path.join(repoPath, '.git', 'hooks', 'post-commit')
      postCommitGitSwitchPath = path.join(repoPath, '.git', 'hooks', 'post-commit.git-switch')

      sinon.stub(fs, 'existsSync')
        .withArgs(repoPath).callsFake(() => pathExists)
        .withArgs(path.join(repoPath, '.git')).callsFake(() => repoExists)
        .withArgs(path.join(repoPath, '.git', 'modules')).callsFake(() => submoduleExists)
        .withArgs(path.join(repoPath, '.git', 'hooks', 'post-commit')).callsFake(() => postCommitExists)
      sinon.stub(fs, 'statSync').callsFake(() => ({ mode: 33188 }))
      sinon.stub(fs, 'chmodSync')
    })
    afterEach(() => {
      fs.existsSync.restore()
      fs.statSync.restore()
      fs.chmodSync.restore()
    })

    describe('when path is a git repo', () => {
      let existingPostCommitScript
      let readStream
      let writeStream
      let postCommitBuffer = []

      beforeEach(() => {
        existingPostCommitScript = ''
        readStream = new Readable()
        writeStream = new Writable({
          write: (data, enc, cb) => {
            postCommitBuffer.push(data)
            cb()
          }
        })

        sinon.stub(fs, 'readFileSync').callsFake(() => existingPostCommitScript)
        sinon.stub(fs, 'writeFileSync')
        sinon.stub(fs, 'createReadStream').callsFake(() => readStream)
        sinon.stub(fs, 'createWriteStream').callsFake(() => writeStream)
      })
      afterEach(() => {
        fs.readFileSync.restore()
        fs.writeFileSync.restore()
        fs.createReadStream.restore()
        fs.createWriteStream.restore()
      })

      it('copies the post-commit.git-switch file', () => {
        subject.initRepo(repoPath)
        readStream.emit('data', '123')
        expect(fs.createReadStream).to.have.been.calledWith(path.join(subject.GIT_SWITCH_PATH, 'post-commit'), 'utf-8')
        expect(fs.createWriteStream).to.have.been.calledWith(postCommitGitSwitchPath, 'utf-8')
        expect(postCommitBuffer.toString('utf-8')).to.eql('123')
      })

      it('marks the post-commit.git-switch file executable', () => {
        subject.initRepo(repoPath)
        expect(fs.chmodSync).to.have.been.calledWith(postCommitGitSwitchPath, '0755')
      })

      it('writes post-commit file to call post-commit.git-switch', () => {
        subject.initRepo(repoPath)
        expect(fs.writeFileSync).to.have.been.calledWith(postCommitPath, subject.POST_COMMIT_BASE, 'utf-8')
        expect(fs.chmodSync).to.have.been.calledWith(postCommitGitSwitchPath, '0755')
      })

      describe('when post-commit already exists', () => {
        beforeEach(() => {
          postCommitExists = true
        })

        it('merges git-swtich call into post-commit', () => {
          existingPostCommitScript = '#!/bin/bash\n\necho "Committed"'
          const expected = `${subject.POST_COMMIT_BASE}\n\necho "Committed"`

          subject.initRepo(repoPath)

          expect(fs.writeFileSync).to.have.been.calledWith(postCommitPath, expected)
          expect(fs.chmodSync).to.have.been.calledWith(postCommitGitSwitchPath, '0755')
        })
      })

      describe('when sub-modules exist', () => {
        const submoduleDirs = ['mod1', 'mod2']

        beforeEach(() => {
          submoduleExists = true
          sinon.stub(fs, 'readdirSync').callsFake(() => submoduleDirs)
        })
        afterEach(() => {
          fs.readdirSync.restore()
        })

        it('installs post-commit files in sub-modules', () => {
          const submodule1GitHooksPath = path.join(repoPath, '.git', 'modules', 'mod1', 'hooks')
          const submodule2GitHooksPath = path.join(repoPath, '.git', 'modules', 'mod2', 'hooks')

          subject.initRepo(repoPath)

          expect(fs.createReadStream).to.have.been.calledWith(path.join(subject.GIT_SWITCH_PATH, 'post-commit'), 'utf-8')

          expect(fs.createWriteStream).to.have.been.calledWith(path.join(submodule1GitHooksPath, 'post-commit.git-switch'), 'utf-8')
          expect(fs.chmodSync).to.have.been.calledWith(path.join(submodule1GitHooksPath, 'post-commit.git-switch'), '0755')
          expect(fs.writeFileSync).to.have.been.calledWith(path.join(submodule1GitHooksPath, 'post-commit'), subject.POST_COMMIT_BASE, 'utf-8')
          expect(fs.chmodSync).to.have.been.calledWith(path.join(submodule1GitHooksPath, 'post-commit'), '0755')

          expect(fs.createWriteStream).to.have.been.calledWith(path.join(submodule2GitHooksPath, 'post-commit.git-switch'), 'utf-8')
          expect(fs.chmodSync).to.have.been.calledWith(path.join(submodule2GitHooksPath, 'post-commit.git-switch'), '0755')
          expect(fs.writeFileSync).to.have.been.calledWith(path.join(submodule2GitHooksPath, 'post-commit'), subject.POST_COMMIT_BASE, 'utf-8')
          expect(fs.chmodSync).to.have.been.calledWith(path.join(submodule2GitHooksPath, 'post-commit'), '0755')
        })
      })
    })

    describe('when path does not exist', () => {
      it('throws an error', () => {
        pathExists = false
        expect(() => subject.initRepo(repoPath)).to.throw
      })
    })

    describe('when path is not a git repo', () => {
      it('throws an error', () => {
        repoExists = false
        expect(() => subject.initRepo(repoPath)).to.throw
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

      sinon.stub(fs, 'existsSync')
        .withArgs(path.join(repoPath, '.git', 'modules')).callsFake(() => submoduleExists)
        .withArgs(path.join(repoPath, '.git', 'modules', 'mod1', 'hooks', 'post-commit.git-switch')).callsFake(() => submoduleExists)
        .withArgs(path.join(repoPath, '.git', 'modules', 'mod1', 'hooks', 'post-commit')).callsFake(() => submoduleExists)
        .withArgs(path.join(repoPath, '.git', 'modules')).callsFake(() => submoduleExists)
        .withArgs(path.join(repoPath, '.git', 'hooks', 'post-commit')).callsFake(() => postCommitExists)
        .withArgs(postCommitGitSwitchPath).callsFake(() => postCommitGitSwitchExists)
      sinon.stub(fs, 'unlinkSync')
      sinon.stub(fs, 'readFileSync').callsFake(() => postCommitScript)
      sinon.stub(fs, 'writeFileSync')
    })
    afterEach(() => {
      fs.existsSync.restore()
      fs.unlinkSync.restore()
      fs.readFileSync.restore()
      fs.writeFileSync.restore()
    })

    it('deletes the post-commit.git-switch file', () => {
      subject.removeRepo(repoPath)
      expect(fs.unlinkSync).to.have.been.calledWith(postCommitGitSwitchPath)
    })

    it('removes the git switch call in post-commit', () => {
      const expected = postCommitScript.replace(postCommitGitSwitch, '')
      subject.removeRepo(repoPath)
      expect(fs.writeFileSync).to.have.been.calledWith(path.join(repoPath, '.git', 'hooks', 'post-commit'), expected, 'utf-8')
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
        sinon.stub(fs, 'readdirSync').callsFake(() => submoduleDirs)
      })
      afterEach(() => {
        fs.readdirSync.restore()
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

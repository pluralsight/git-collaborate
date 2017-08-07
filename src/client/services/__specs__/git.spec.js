import { expect } from 'chai'
import fs from 'fs'
import path from 'path'
import * as sinon from 'sinon'
import { Readable, Writable } from 'stream'

import * as execute from '../../../utils/exec'
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

  describe('#getAuthorAndCommitter', () => {
    let users

    beforeEach(() => {
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

    describe('when this is one active user', () => {
      it('uses one user as author and committer', () => {
        const user = users[0]

        const actual = subject.getAuthorAndCommitter([user])

        expect(actual.author).to.eql({ name: user.name, email: user.email })
        expect(actual.committer).to.eql({ name: user.name, email: user.email })
      })
    })

    describe('when there are two active users', () => {
      it('uses the first as author and second as committer', () => {
        users = [users[0], users[1], users[3]]

        const actual = subject.getAuthorAndCommitter(users)

        expect(actual.author).to.eql({ name: users[0].name, email: users[0].email })
        expect(actual.committer).to.eql({ name: users[1].name, email: users[1].email })
      })
    })

    describe('when there are three or more active users', () => {
      it('uses the first as author and all others as committer', () => {
        const activeUsers = users.filter(u => u.active).slice(1)
        const committerName = activeUsers.map(u => u.name).join(' & ')
        const committerEmail = activeUsers.map(u => u.email).join(', ')

        const actual = subject.getAuthorAndCommitter(users)

        expect(actual.author).to.eql({ name: users[0].name, email: users[0].email })
        expect(actual.committer).to.eql({ name: committerName, email: committerEmail })
      })
    })

    describe('when no users are active', () => {
      it('returns empty', () => {
        const expected = {
          author: { name: '', email: '' },
          committer: { name: '', email: '' }
        }
        expect(subject.getAuthorAndCommitter([users[3]])).to.eql(expected)
      })
    })
  })

  describe('#initRepo', () => {
    let repoPath
    let pathExists
    let repoExists
    let postCommitExists

    beforeEach(() => {
      repoPath = '/repo/path'
      pathExists = true
      repoExists = true
      postCommitExists = false
      sinon.stub(fs, 'existsSync')
        .withArgs(repoPath).callsFake(() => pathExists)
        .withArgs(path.join(repoPath, '.git')).callsFake(() => repoExists)
        .withArgs(path.join(repoPath, '.git', 'hooks', 'post-commit')).callsFake(() => postCommitExists)
    })
    afterEach(() => {
      fs.existsSync.restore()
    })

    describe('when path is a git repo', () => {
      const postCommitGitSwitch = '/bin/bash "$(dirname $0)"/post-commit.git-switch'
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
        expect(fs.createReadStream).to.have.been.calledWith(path.join(process.cwd(), 'scripts', 'post-commit'), 'utf-8')
        expect(fs.createWriteStream).to.have.been.calledWith(path.join(repoPath, '.git', 'hooks', 'post-commit.git-switch'), 'utf-8')
        expect(postCommitBuffer.toString('utf-8')).to.eql('123')
      })

      it('writes post-commit file to call post-commit.git-switch', () => {
        const expected = `#!/bin/bash\n\n${postCommitGitSwitch}`
        subject.initRepo(repoPath)
        expect(fs.writeFileSync).to.have.been.calledWith(path.join(repoPath, '.git', 'hooks', 'post-commit'), expected, 'utf-8')
      })

      describe('when post-commit already exists', () => {
        beforeEach(() => {
          postCommitExists = true
        })

        it('merges git-swtich call into post-commit', () => {
          existingPostCommitScript = '#!/bin/bash\n\necho "Committed"'
          const expected = `#!/bin/bash\n\n${postCommitGitSwitch}\n\necho "Committed"`

          subject.initRepo(repoPath)

          expect(fs.writeFileSync).to.have.been.calledWith(path.join(repoPath, '.git', 'hooks', 'post-commit'), expected)
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
})
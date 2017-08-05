import { expect } from 'chai'
import * as sinon from 'sinon'

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
})

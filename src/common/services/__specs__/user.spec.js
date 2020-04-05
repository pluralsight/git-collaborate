import { expect } from 'chai'

import { gitService, sshService, userService as subject } from '../'
import sandbox from '../../../../test/sandbox'
import { config as configUtil } from '../../utils'

describe('services/user', () => {
  let users
  let config

  beforeEach(() => {
    users = [{
      id: subject.generateId(),
      name: 'First User',
      email: 'first@email.com',
      rsaKeyPath: '/not/a/real/path',
      active: false
    }, {
      id: subject.generateId(),
      name: 'Second User',
      email: 'second@email.com',
      rsaKeyPath: '/not/a/real/path',
      active: false
    }]
    config = { users }

    sandbox.stub(configUtil, 'read').callsFake(() => config)
    sandbox.stub(configUtil, 'write')
    sandbox.stub(gitService, 'updateAuthorAndCoAuthors')
    sandbox.stub(sshService, 'rotateIdentityFile')
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#get', () => {
    it('returns the users in config', () => {
      expect(subject.get()).to.deep.equal(users)
    })

    describe('when users is null', () => {
      it('returns empty array', () => {
        config = {}
        expect(subject.get()).to.deep.equal([])
      })
    })
  })

  describe('#generateId', () => {
    it('returns an eight char id', () => {
      const id = subject.generateId()
      expect(id.length).to.equal(8)
    })

    it('returns a minimum of one alpha character', () => {
      for (let i = 0; i < 100; i++) {
        const id = subject.generateId()
        expect(id).to.match(/[a-f]+/)
      }
    })
  })

  describe('#add', () => {
    let userToAdd

    beforeEach(() => {
      userToAdd = {
        name: 'New User',
        email: 'new@email.com',
        rsaKeyPath: '/a/path/to/nowhere'
      }

      users = [
        {
          ...users[0],
          active: true
        },
        users[1]
      ]
      config = { users }
    })

    it('adds user to config', () => {
      const actual = subject.add(userToAdd)

      const addedUser = actual[1]
      const expected = { ...config, users: actual }

      expect(addedUser.id.length).to.equal(8)
      expect(addedUser.name).to.equal(userToAdd.name)
      expect(addedUser.email).to.equal(userToAdd.email)
      expect(addedUser.id).to.not.be.null
      expect(configUtil.write).to.have.been.calledWith(expected)
    })

    it('updates git authors and rsa keys', () => {
      const updatedUsers = subject.add(userToAdd)

      expect(gitService.updateAuthorAndCoAuthors).to.have.been.calledWith(updatedUsers)
      expect(sshService.rotateIdentityFile).to.have.been.calledWith(updatedUsers[0].rsaKeyPath)
    })
  })

  describe('#update', () => {
    let userToUpdate

    beforeEach(() => {
      userToUpdate = {
        ...users[1],
        name: 'Changed Name'
      }
    })

    it('updates the user in config', () => {
      const expected = {
        users: [
          config.users[0],
          userToUpdate
        ]
      }

      const actual = subject.update(userToUpdate)

      expect(actual).to.deep.equal(expected.users)
      expect(configUtil.write).to.have.been.calledWith(expected)
    })

    it('updates git authors and rsa keys', () => {
      const updatedUsers = subject.update(userToUpdate)

      expect(gitService.updateAuthorAndCoAuthors).to.have.been.calledWith(updatedUsers)
      expect(sshService.rotateIdentityFile).to.have.been.calledWith(updatedUsers[0].rsaKeyPath)
    })

    describe('when updated user does not already exist', () => {
      it('adds user to config', () => {
        userToUpdate = {
          name: 'New User',
          email: 'new@email.com',
          rsaKeyPath: '/a/path/to/nowhere'
        }
        const expected = {
          users: [
            ...config.users,
            userToUpdate
          ]
        }

        const actual = subject.update(userToUpdate)

        expect(actual).to.deep.equal(expected.users)
        expect(configUtil.write).to.have.been.calledWith(expected)
      })
    })
  })

  describe('#remove', () => {
    it('removes the user from the config', () => {
      const newConfig = { ...config, users: [users[1]] }
      const expected = [users[1]]
      const actual = subject.remove([users[0].id])

      expect(actual).to.deep.equal(expected)
      expect(configUtil.write).to.have.been.calledWith(newConfig)
    })

    it('updates git authors and rsa keys', () => {
      const updatedUsers = subject.remove([users[0].id])

      expect(gitService.updateAuthorAndCoAuthors).to.have.been.calledWith(updatedUsers)
      expect(sshService.rotateIdentityFile).to.have.been.calledWith(updatedUsers[0].rsaKeyPath)
    })

    it('allows removing by name', () => {
      const expected = [users[1]]
      const actual = subject.remove(['first'])

      expect(actual).to.deep.equal(expected)
    })

    describe('when user does not exist', () => {
      it('does nothing', () => {
        subject.remove(['not-a-user'])

        expect(configUtil.write).to.not.have.been.called
        expect(gitService.updateAuthorAndCoAuthors).to.not.have.been.called
        expect(sshService.rotateIdentityFile).to.not.have.been.called
      })
    })
  })

  describe('#rotate', () => {
    describe('when no users are active', () => {
      it('returns current users', () => {
        const actual = subject.rotate()

        expect(actual).to.deep.equal(users)
        expect(configUtil.write).to.not.have.been.called
        expect(gitService.updateAuthorAndCoAuthors).to.not.have.been.called
        expect(sshService.rotateIdentityFile).to.not.have.been.called
      })
    })

    describe('when only one user is active', () => {
      it('returns current users', () => {
        users = [
          { ...users[0], active: true },
          users[1]
        ]
        config = { users }

        const actual = subject.rotate()

        expect(actual).to.deep.equal(users)
        expect(configUtil.write).to.not.have.been.called
        expect(gitService.updateAuthorAndCoAuthors).to.not.have.been.called
        expect(sshService.rotateIdentityFile).to.not.have.been.called
      })
    })

    describe('when a pair is active', () => {
      let expected

      beforeEach(() => {
        users = users
          .map(u => ({ ...u, active: true }))
          .concat({
            name: 'Third User',
            email: 'third@email.com',
            rsaKeyPath: '/foo/bar',
            active: false
          })
        expected = {
          users: [
            users[1],
            users[0],
            users[2]
          ]
        }
        config = { users }
      })

      it('switches the pair leaving inactive users last', () => {
        const actual = subject.rotate()

        expect(actual).to.deep.equal(expected.users)
        expect(configUtil.write).to.have.been.calledWith(expected)
      })

      it('updates git authors and rsa keys', () => {
        subject.rotate()

        expect(gitService.updateAuthorAndCoAuthors).to.have.been.calledWith(expected.users)
        expect(sshService.rotateIdentityFile).to.have.been.calledWith(users[1].rsaKeyPath)
      })
    })

    describe('when a mob is active', () => {
      let expected

      beforeEach(() => {
        users = users
          .map(u => ({ ...u, active: true }))
          .concat([{
            name: 'Third User',
            email: 'third@email.com',
            rsaKeyPath: '/foo/bar',
            active: true
          }, {
            name: 'Fourth User',
            email: 'fourth@email.com',
            rsaKeyPath: '/herp/derp',
            active: false
          }])
        expected = {
          users: [
            users[1],
            users[2],
            users[0],
            users[3]
          ]
        }
        config = { users }
      })

      it('moves the first user to the end of active users leaving inactive users last', () => {
        const actual = subject.rotate()

        expect(actual).to.deep.equal(expected.users)
        expect(configUtil.write).to.have.been.calledWith(expected)
      })

      it('updates git authors and rsa keys', () => {
        subject.rotate()

        expect(gitService.updateAuthorAndCoAuthors).to.have.been.calledWith(expected.users)
        expect(sshService.rotateIdentityFile).to.have.been.calledWith(users[1].rsaKeyPath)
      })
    })
  })

  describe('#toggleActive', () => {
    let expected

    beforeEach(() => {
      users = [
        { ...users[0], active: true },
        users[1],
        {
          id: subject.generateId(),
          name: 'Third User',
          email: 'third@email.com',
          rsaKeyPath: '/foo/bar',
          active: false
        },
        {
          id: subject.generateId(),
          name: 'Fourth User',
          email: 'fourth@email.com',
          rsaKeyPath: '/foo/bar',
          active: false
        }
      ]
      expected = {
        users: [
          users[0],
          { ...users[2], active: true },
          { ...users[3], active: true },
          users[1]
        ]
      }
      config = { users }
    })

    it('moves the user(s) to the end of active users leaving inactive users last', () => {
      const actual = subject.toggleActive([users[2].id, users[3].id])

      expect(actual).to.deep.equal(expected.users)
      expect(configUtil.write).to.have.been.calledWith(expected)
    })

    it('updates git authors and rsa keys', () => {
      subject.toggleActive([users[2].id, users[3].id])

      expect(gitService.updateAuthorAndCoAuthors).to.have.been.calledWith(expected.users)
      expect(sshService.rotateIdentityFile).to.have.been.calledWith(users[0].rsaKeyPath)
    })

    it('allows toggling by name', () => {
      const actual = subject.toggleActive(['third', 'fourth'])

      expect(actual).to.deep.equal(expected.users)
      expect(configUtil.write).to.have.been.calledWith(expected)
    })

    describe('when deactivating users', () => {
      beforeEach(() => {
        users = [
          { ...users[0], active: true },
          { ...users[1], active: true },
          {
            id: subject.generateId(),
            name: 'Third User',
            email: 'third@email.com',
            rsaKeyPath: '/foo/bar',
            active: false
          },
          {
            id: subject.generateId(),
            name: 'Fourth User',
            email: 'fourth@email.com',
            rsaKeyPath: '/foo/bar',
            active: false
          }
        ]
        expected = {
          users: [
            users[1],
            { ...users[0], active: false },
            users[2],
            users[3]
          ]
        }
        config = { users }
      })

      it('moves the user(s) to the top of inactive list', () => {
        const actual = subject.toggleActive([users[0].id])

        expect(actual).to.deep.equal(expected.users)
      })
    })

    describe('when user does not exist', () => {
      it('returns current users', () => {
        const actual = subject.toggleActive([subject.generateId()])

        expect(actual).to.deep.equal(users)
        expect(configUtil.write).to.not.have.been.called
        expect(gitService.updateAuthorAndCoAuthors).to.not.have.been.called
        expect(sshService.rotateIdentityFile).to.not.have.been.called
      })
    })
  })
})

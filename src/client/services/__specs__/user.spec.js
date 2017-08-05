import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'
import * as sinon from 'sinon'
import uuid from 'uuid/v4'

import * as subject from '../user'

const FILE = path.join(os.homedir(), '.git-switch.json')

describe('services/user', () => {
  let users
  let config

  beforeEach(() => {
    users = [{
      id: uuid(),
      name: 'First User',
      email: 'first@email.com',
      rsaKeyPath: '/not/a/real/path',
      active: false
    }, {
      id: uuid(),
      name: 'Second User',
      email: 'second@email.com',
      rsaKeyPath: '/not/a/real/path',
      active: false
    }]
    config = { users }

    sinon.stub(fs, 'existsSync').callsFake(() => true)
    sinon.stub(fs, 'readFileSync').callsFake(() => JSON.stringify(config, null, 2))
    sinon.stub(fs, 'writeFileSync')
  })

  afterEach(() => {
    fs.existsSync.restore()
    fs.readFileSync.restore()
    fs.writeFileSync.restore()
  })

  describe('#get', () => {
    it('returns the users in config', () => {
      expect(subject.get()).to.eql(users)
    })
  })

  describe('#add', () => {
    it('adds user to config', () => {
      const userToAdd = {
        name: 'New User',
        email: 'new@email.com',
        rsaKeyPath: '/a/path/to/nowhere'
      }

      const results = subject.add(userToAdd)
      const addedUser = results[2]

      expect(addedUser.name).to.eql(userToAdd.name)
      expect(addedUser.email).to.eql(userToAdd.email)
      expect(addedUser.id).to.not.be.null
      expect(fs.writeFileSync).to.have.been.calledWith(FILE, JSON.stringify({...config, users: results}, null, 2))
    })
  })

  describe('#update', () => {
    it('updates the user in config', () => {
      const userToUpdate = {
        ...users[1],
        name: 'Changed Name'
      }
      const expected = {
        ...config,
        users: [
          config.users[0],
          userToUpdate
        ]
      }

      const actual = subject.update(userToUpdate)

      expect(actual).to.eql(expected.users)
      expect(fs.writeFileSync).to.have.been.calledWith(FILE, JSON.stringify(expected, null, 2))
    })

    describe('when updated user does not already exist', () => {
      it('adds user to config', () => {
        const userToUpdate = {
          name: 'New User',
          email: 'new@email.com',
          rsaKeyPath: '/a/path/to/nowhere'
        }
        const expected = {
          ...config,
          users: [
            ...config.users,
            userToUpdate
          ]
        }

        const actual = subject.update(userToUpdate)

        expect(actual).to.eql(expected.users)
        expect(fs.writeFileSync).to.have.been.calledWith(FILE, JSON.stringify(expected, null, 2))
      })
    })
  })

  describe('#remove', () => {
    it('removes the user from the config', () => {
      const expected = {...config, users: [users[0]]}
      const actual = subject.remove(users[1].id)

      expect(actual.length).to.eql(1)
      expect(fs.writeFileSync).to.have.been.calledWith(FILE, JSON.stringify(expected, null, 2))
    })
  })

  describe('#rotate', () => {
    describe('when no users are active', () => {
      it('returns current users', () => {
        const actual = subject.rotate()

        expect(actual).to.eql(users)
        expect(fs.writeFileSync).to.not.have.been.called
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

        expect(actual).to.eql(users)
        expect(fs.writeFileSync).to.not.have.been.called
      })
    })

    describe('when a pair is active', () => {
      it('switches the pair leaving inactive users last', () => {
        users = users
          .map(u => ({ ...u, active: true }))
          .concat({
            name: 'Third User',
            email: 'third@email.com',
            rsaKeyPath: '/foo/bar',
            active: false
          })
        const expected = {
          ...config,
          users: [
            users[1],
            users[0],
            users[2]
          ]
        }
        config = { users }

        const actual = subject.rotate()

        expect(actual).to.eql(expected.users)
        expect(fs.writeFileSync).to.have.been.calledWith(FILE, JSON.stringify(expected, null, 2))
      })
    })

    describe('when a mob is active', () => {
      it('moves the first user to the end of active users leaving inactive users last', () => {
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
        const expected = {
          ...config,
          users: [
            users[1],
            users[2],
            users[0],
            users[3]
          ]
        }
        config = { users }

        const actual = subject.rotate()

        expect(actual).to.eql(expected.users)
        expect(fs.writeFileSync).to.have.been.calledWith(FILE, JSON.stringify(expected, null, 2))
      })
    })
  })

  describe('#toggleActive', () => {
    beforeEach(() => {
      users = [
        { ...users[0], active: true },
        users[1],
        {
          id: uuid(),
          name: 'Third User',
          email: 'third@email.com',
          rsaKeyPath: '/foo/bar',
          active: false
        }
      ]
      config = { users }
    })

    it('moves the user to the end of active users leaving inactive users last', () => {
      const expected = {
        ...config,
        users: [
          users[0],
          { ...users[2], active: true },
          users[1]
        ]
      }

      const actual = subject.toggleActive(users[2].id)

      expect(actual).to.eql(expected.users)
      expect(fs.writeFileSync).to.have.been.calledWith(FILE, JSON.stringify(expected, null, 2))
    })

    describe('when user does not exist', () => {
      it('returns current users', () => {
        const actual = subject.toggleActive(uuid())

        expect(actual).to.eql(users)
        expect(fs.writeFileSync).to.not.have.been.called
      })
    })
  })

  describe('#clearActive', () => {
    it('unsets the active flag on all users', () => {
      users = [
        { ...users[0], active: true },
        { ...users[1], active: true },
        {
          name: 'Third User',
          email: 'third@email.com',
          rsaKeyPath: '/foo/bar',
          active: false
        }
      ]
      const expected = {
        ...config,
        users: users.map(u => ({ ...u, active: false }))
      }
      config = { users }

      const actual = subject.clearActive()

      expect(actual).to.eql(expected.users)
      expect(fs.writeFileSync).to.have.been.calledWith(FILE, JSON.stringify(expected, null, 2))
    })
  })
})

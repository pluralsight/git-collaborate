import { expect } from 'chai'

import * as subject from '../string'

describe('utils/string', () => {
  describe('#formatActiveUserFirstNames', () => {
    const kaiden = { name: 'Kaiden Rawlinson', active: true }
    const james = { name: 'James Walsh', active: true }
    const parker = { name: 'Parker Holladay', active: true }
    it(`lists the active users' first names`, () => {
      const users = [kaiden, { ...james, active: false }, parker]
      expect(subject.formatActiveUserFirstNames(users)).to.equal('Kaiden and Parker')
    })

    it('lists one active user', () => {
      const users = [{ ...kaiden, active: false }, { ...parker, active: false }, james]
      expect(subject.formatActiveUserFirstNames(users)).to.equal('James')
    })

    it('lists three active users', () => {
      const users = [kaiden, parker, james]
      expect(subject.formatActiveUserFirstNames(users)).to.equal('Kaiden, Parker and James')
    })
  })

  describe('#getNotificationLabel', () => {
    it('returns "author" if userCount is 1', () => {
      expect(subject.getNotificationLabel(1)).to.equal('author')
    })

    it('returns "pair" if userCount is 2', () => {
      expect(subject.getNotificationLabel(2)).to.equal('pair')
    })

    it('returns "mob" if userCount is > 2', () => {
      expect(subject.getNotificationLabel(3)).to.equal('mob')
    })

    it('capitalizes if shouldCapitalize is true', () => {
      expect(subject.getNotificationLabel(4, true)).to.equal('Mob')
    })
  })

  describe('#getLongestString', () => {
    it('returns the length of the longest string', () => {
      const strings = ['short', 'thisislong', 'thisisreallylong']
      expect(subject.getLongestString(strings)).to.equal(16)
    })
  })
})

import { expect } from 'chai'

import * as subject from '../string'

describe('utils/string', () => {
  describe('#formatActiveUserFirstNames', () => {
    const kaiden = { name: 'Kaiden Rawlinson', active: true }
    const james = { name: 'James Walsh', active: true }
    const parker = { name: 'Parker Holladay', active: true }
    it(`lists the active users' first names`, () => {
      const users = [kaiden, { ...james, active: false }, parker]
      expect(subject.formatActiveUserFirstNames(users)).to.eql('Kaiden and Parker')
    })

    it('lists one active user', async () => {
      const users = [{ ...kaiden, active: false }, { ...parker, active: false }, james]
      expect(subject.formatActiveUserFirstNames(users)).to.eql('James')
    })

    it('lists three active users', async () => {
      const users = [kaiden, parker, james]
      expect(subject.formatActiveUserFirstNames(users)).to.eql('Kaiden, Parker and James')
    })
  })

  describe('#getNotificationLabel', () => {
    it('returns "author" if userCount is 1', async () => {
      expect(subject.getNotificationLabel(1)).to.eql('author')
    })

    it('returns "pair" if userCount is 2', async () => {
      expect(subject.getNotificationLabel(2)).to.eql('pair')
    })

    it('returns "mob" if userCount is > 2', async () => {
      expect(subject.getNotificationLabel(3)).to.eql('mob')
    })

    it('capitalizes if shouldCapitalize is true', async () => {
      expect(subject.getNotificationLabel(4, true)).to.eql('Mob')
    })
  })
})

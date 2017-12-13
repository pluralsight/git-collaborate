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

  describe('#getCommiterLabel', () => {
    it('returns "commiter" if userCount is 1', async () => {
      expect(subject.getCommiterLabel(1)).to.eql('commiter')
    })

    it('returns "pair" if userCount is 2', async () => {
      expect(subject.getCommiterLabel(2)).to.eql('pair')
    })

    it('returns "mob" if userCount is > 2', async () => {
      expect(subject.getCommiterLabel(3)).to.eql('mob')
    })

    it('capitalizes if capitalize is true', async () => {
      expect(subject.getCommiterLabel(4, true)).to.eql('Mob')
    })
  })
})

import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'

import * as subject from '../config'
import sandbox from '../../../../test/sandbox'

const FILE = path.join(os.homedir(), '.git-switch', 'config.json')

describe('utils/config', () => {
  let config
  let configExists

  beforeEach(() => {
    configExists = true
    config = {
      users: [{
        name: 'First User',
        email: 'first@email.com',
        rsaKeyPath: '/not/a/real/path',
        active: false
      }]
    }

    sandbox.stub(fs, 'existsSync').callsFake(() => configExists)
    sandbox.stub(fs, 'readFileSync').callsFake(() => JSON.stringify(config, null, 2))
  })
  afterEach(() => {
    sandbox.restore()
  })

  describe('#read', () => {
    it('returns the users in config', () => {
      expect(subject.read()).to.eql(config)
    })

    describe('when file does not exist', () => {
      it('returns default config', () => {
        configExists = false
        expect(subject.read()).to.eql({ users: [] })
      })
    })
  })

  describe('#write', () => {
    beforeEach(() => {
      sandbox.stub(fs, 'writeFileSync')
    })

    it('merges existing config with new config', () => {
      const newConfig = {
        newKey: 'foo'
      }
      const expected = {
        ...config,
        ...newConfig
      }

      subject.write(newConfig)

      expect(fs.writeFileSync).to.have.been.calledWith(FILE, JSON.stringify(expected, null, 2), { encoding: 'utf-8', mode: 0o644 })
    })

    it('over-writes existing keys', () => {
      const newConfig = {
        users: [{
          name: 'Second User',
          email: 'second@email.com',
          rsaKeyPath: '/totes/a/real/path',
          active: false
        }]
      }

      subject.write(newConfig)

      expect(fs.writeFileSync).to.have.been.calledWith(FILE, JSON.stringify(newConfig, null, 2), { encoding: 'utf-8', mode: 0o644 })
    })
  })
})

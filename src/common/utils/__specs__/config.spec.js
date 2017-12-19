import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'
import * as sinon from 'sinon'

import * as subject from '../config'

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

    sinon.stub(fs, 'existsSync').callsFake(() => configExists)
    sinon.stub(fs, 'readFileSync').callsFake(() => JSON.stringify(config, null, 2))
  })
  afterEach(() => {
    fs.existsSync.restore()
    fs.readFileSync.restore()
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
      sinon.stub(fs, 'writeFileSync')
    })
    afterEach(() => {
      fs.writeFileSync.restore()
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

      expect(fs.writeFileSync).to.have.been.calledWith(FILE, JSON.stringify(expected, null, 2), 'utf-8')
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

      expect(fs.writeFileSync).to.have.been.calledWith(FILE, JSON.stringify(newConfig, null, 2), 'utf-8')
    })
  })
})

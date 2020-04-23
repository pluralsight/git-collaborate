import { expect } from 'chai'
import fs from 'fs'

import { sshService as subject } from '../'
import sandbox from '../../../../test/sandbox'
import { config } from '../../utils'

describe('services/ssh', () => {
  afterEach(() => {
    sandbox.restore()
  })

  describe('#rotateIdentityFile', () => {
    let identityFile
    let sshConfigExists
    let existingSshConfigFileContents
    let expectedSshConfigContents
    let gitSwitchConfig

    beforeEach(() => {
      identityFile = '/path/to/rsa/key'
      sshConfigExists = true
      existingSshConfigFileContents = `Host github.com
\tIdentityFile foo/bar
`
      expectedSshConfigContents = existingSshConfigFileContents.replace('foo/bar', identityFile)
      gitSwitchConfig = {}

      sandbox.stub(fs, 'existsSync').callsFake(() => sshConfigExists)
      sandbox.stub(fs, 'readFileSync').callsFake(() => existingSshConfigFileContents)
      sandbox.stub(fs, 'writeFileSync')
      sandbox.stub(config, 'read').callsFake(() => gitSwitchConfig)
    })

    describe('when identityFile is null or empty', () => {
      beforeEach(() => {
        identityFile = ''
      })

      it('does nothing', () => {
        subject.rotateIdentityFile(identityFile)

        expect(fs.existsSync).to.not.have.been.called
        expect(fs.readFileSync).to.not.have.been.called
        expect(fs.writeFileSync).to.not.have.been.called
      })
    })

    describe('when github rsa config exists', () => {
      it('updates the ssh config file', () => {
        subject.rotateIdentityFile(identityFile)

        expect(fs.existsSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH)
        expect(fs.readFileSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH, 'utf-8')
        expect(fs.writeFileSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH, expectedSshConfigContents, { encoding: 'utf-8', mode: 0o644 })
      })

      describe('when github rsa config already matches', () => {
        beforeEach(() => {
          existingSshConfigFileContents = expectedSshConfigContents
        })

        it('does not update ssh config file', () => {
          subject.rotateIdentityFile(identityFile)

          expect(fs.existsSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH)
          expect(fs.readFileSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH, 'utf-8')
          expect(fs.writeFileSync).to.not.have.been.called
        })
      })

      describe('when github rsa config has extra fields', () => {
        beforeEach(() => {
          existingSshConfigFileContents = `Host github.com
\tHostName github.com
\tUser git
\tIdentityFile foo/bar
`
          expectedSshConfigContents = existingSshConfigFileContents.replace('foo/bar', identityFile)
        })

        it('updates the rsa identity file', () => {
          subject.rotateIdentityFile(identityFile)

          expect(fs.existsSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH)
          expect(fs.readFileSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH, 'utf-8')
          expect(fs.writeFileSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH, expectedSshConfigContents, { encoding: 'utf-8', mode: 0o644 })
        })
      })
    })

    describe('when github rsa config does not exist', () => {
      describe('when ssh config is empty', () => {
        beforeEach(() => {
          existingSshConfigFileContents = ''
        })

        it('adds github rsa config to ssh config file', () => {
          subject.rotateIdentityFile(identityFile)

          expect(fs.existsSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH)
          expect(fs.readFileSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH, 'utf-8')
          expect(fs.writeFileSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH, expectedSshConfigContents, { encoding: 'utf-8', mode: 0o644 })
        })
      })

      describe('when ssh config is not empty', () => {
        beforeEach(() => {
          existingSshConfigFileContents = `Host acme.com
\tHostName 192.168.1.1
\tUser admin
\tIdentityFile path/to/id/file
`
          expectedSshConfigContents = `${existingSshConfigFileContents}
Host github.com
\tIdentityFile ${identityFile}
`
        })

        it('adds github rsa config to ssh config file', () => {
          subject.rotateIdentityFile(identityFile)

          expect(fs.existsSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH)
          expect(fs.readFileSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH, 'utf-8')
          expect(fs.writeFileSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH, expectedSshConfigContents, { encoding: 'utf-8', mode: 0o644 })
        })
      })
    })

    describe('when ssh config does not exist', () => {
      beforeEach(() => {
        sshConfigExists = false
      })

      it('creates ssh config with github rsa config', () => {
        subject.rotateIdentityFile(identityFile)

        expect(fs.existsSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH)
        expect(fs.writeFileSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH, expectedSshConfigContents, { encoding: 'utf-8', mode: 0o644 })
      })
    })

    describe('when host is included in config', () => {
      beforeEach(() => {
        gitSwitchConfig = { host: 'gitlab.com' }

        expectedSshConfigContents = `${existingSshConfigFileContents}
Host gitlab.com
\tIdentityFile ${identityFile}
`
      })

      it('adds configured host rsa config to ssh config file', () => {
        subject.rotateIdentityFile(identityFile)

        expect(fs.existsSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH)
        expect(fs.readFileSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH, 'utf-8')
        expect(fs.writeFileSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH, expectedSshConfigContents, { encoding: 'utf-8', mode: 0o644 })
      })

      describe('when ssh config contains the configured host', () => {
        beforeEach(() => {
          existingSshConfigFileContents = `Host gitlab.com
\tIdentityFile foo/bar
`
          expectedSshConfigContents = existingSshConfigFileContents.replace('foo/bar', identityFile)
        })

        it('updates the rsa identity file', () => {
          subject.rotateIdentityFile(identityFile)

          expect(fs.existsSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH)
          expect(fs.readFileSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH, 'utf-8')
          expect(fs.writeFileSync).to.have.been.calledWith(subject.SSH_CONFIG_PATH, expectedSshConfigContents, { encoding: 'utf-8', mode: 0o644 })
        })
      })
    })
  })
})

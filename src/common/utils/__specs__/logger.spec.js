/* eslint-disable no-console */

import { logger as subject } from '../'
import sandbox from '../../../../test/sandbox'

describe('utils/logger', () => {
  beforeEach(() => {
    sandbox.spy(console, 'log')
    sandbox.spy(console, 'error')
  })
  afterEach(() => {
    sandbox.restore()
    global.logToConsoleDisabled = true
  })

  describe('when logging is enabled', () => {
    beforeEach(() => {
      global.logToConsoleDisabled = false
    })

    it('logs info to console', () => {
      subject.info('foo')
      expect(console.log).to.have.been.called
    })

    it('logs errors to console', () => {
      subject.error('foo')
      expect(console.error).to.be.called
    })
  })

  describe('when logging is disabled', () => {
    beforeEach(() => {
      global.logToConsoleDisabled = true
    })

    it('does not log info to console', () => {
      subject.info('foo')
      expect(console.log).to.not.be.called
    })

    it('logs errors to console', () => {
      subject.error('foo')
      expect(console.error).to.not.be.called
    })
  })
})

/* eslint-enable no-console */

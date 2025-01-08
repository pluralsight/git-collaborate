import { logger as subject } from '../'
import sandbox from '../../../../test/sandbox'

describe('utils/logger', () => {
  beforeEach(() => {
    sandbox.spy(console, 'info')
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
      expect(console.info).to.have.been.called
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
      expect(console.info).to.not.be.called
    })

    it('logs errors to console', () => {
      subject.error('foo')
      expect(console.error).to.not.be.called
    })
  })
})

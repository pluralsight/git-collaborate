import { expect } from 'chai'
import proc from 'child_process'

import * as subject from '../exec'
import sandbox from '../../../../test/sandbox'

describe('utils/exec', () => {
  describe('#execute', () => {
    afterEach(() => {
      sandbox.restore()
    })

    it('executes the command with child_process.execSync', () => {
      sandbox.stub(proc, 'execSync').callsFake(() => {})
      subject.execute('git config user.name "foo"')
      expect(proc.execSync).to.have.been.calledWith('git config user.name "foo"')
    })

    it('returns data from command execution', () => {
      const expected = 'some results'
      sandbox.stub(proc, 'execSync').callsFake(() => expected)

      const actual = subject.execute('ls')

      expect(actual).to.equal(expected)
    })

    describe('when execSync throws an error', () => {
      it('throws the error', () => {
        sandbox.stub(proc, 'execSync').callsFake(() => { throw new Error('badness') })
        expect(() => subject.execute('ls')).to.throw(Error)
      })
    })
  })
})

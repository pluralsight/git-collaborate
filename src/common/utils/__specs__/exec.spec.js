import { expect } from 'chai'
import proc from 'child_process'

import subject from '../exec'
import sandbox from '../../../../test/sandbox'

describe('utils/exec', () => {
  afterEach(() => {
    sandbox.restore()
  })

  it('executes the command with child_process.exec', async () => {
    sandbox.stub(proc, 'exec').callsFake((_cmd, _opts, callback) => callback())
    await subject('git config user.name "foo"')
    expect(proc.exec).to.have.been.calledWith('git config user.name "foo"')
  })

  it('returns data from command execution', async () => {
    const expected = 'some results'
    sandbox.stub(proc, 'exec').callsFake((_cmd, _opts, callback) => callback(null, expected))

    const actual = await subject('ls')

    expect(actual).to.eql(expected)
  })

  describe('when exec returns an error', async () => {
    it('rejects with an error', async () => {
      sandbox.stub(proc, 'exec').callsFake((_cmd, _opts, callback) => callback(new Error('badness')))
      return expect(subject('ls')).to.eventually.be.rejectedWith(Error)
    })
  })
})

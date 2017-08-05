import { expect } from 'chai'
import * as sinon from 'sinon'

import * as configUtil from '../../../utils/config'
import * as subject from '../repo'

describe('services/repo', () => {
  let repos
  let config

  beforeEach(() => {
    repos = [
      { name: 'one', path: '/repo/one' },
      { name: 'two', path: '/repo/two' }
    ]
    config = { repos }
    sinon.stub(configUtil, 'read').callsFake(() => config)
  })
  afterEach(() => {
    configUtil.read.restore()
  })

  describe('#get', () => {
    it('returns the repos in config', () => {
      expect(subject.get()).to.eql(repos)
    })

    describe('when repos is null', () => {
      it('returns empty array', () => {
        config = {}
        expect(subject.get()).to.eql([])
      })
    })
  })

  describe('#add', () => {
    beforeEach(() => {
      sinon.stub(configUtil, 'write')
    })
    afterEach(() => {
      configUtil.write.restore()
    })

    it('adds repo to config sorted by name', () => {
      const newRepo = '/foo/bar'
      const expected = {
        repos: [
          { name: 'bar', path: newRepo },
          ...repos
        ]
      }

      subject.add(newRepo)

      expect(configUtil.write).to.have.been.calledWith(expected)
    })
  })

  describe('#remove', () => {
    beforeEach(() => {
      sinon.stub(configUtil, 'write')
    })
    afterEach(() => {
      configUtil.write.restore()
    })

    it('removes the repo from config', () => {
      const expected = {
        repos: [repos[0]]
      }
      subject.remove(repos[1].path)

      expect(configUtil.write).to.have.been.calledWith(expected)
    })

    describe('when repo is not in config', () => {
      it('does nothing', () => {
        subject.remove('/false/repo')
        expect(configUtil.write).to.not.have.been.called
      })
    })
  })
})

import { expect } from 'chai'
import * as sinon from 'sinon'

import * as configUtil from '../../../utils/config'
import * as gitService from '../git'
import * as subject from '../repo'

describe('services/repo', () => {
  let repos
  let config

  beforeEach(() => {
    repos = [
      { name: 'one', path: '/repo/one', isValid: false },
      { name: 'two', path: '/repo/two', isValid: true }
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
      gitService.initRepo.restore()
      configUtil.write.restore()
    })

    it('adds repo to config sorted by name', () => {
      const newRepo = '/foo/bar'
      const expected = {
        repos: [
          { name: 'bar', path: newRepo, isValid: true },
          ...repos
        ]
      }
      sinon.stub(gitService, 'initRepo')

      subject.add(newRepo)

      expect(gitService.initRepo).to.have.been.calledWith(newRepo)
      expect(configUtil.write).to.have.been.calledWith(expected)
    })

    describe('when git service fails to init repo hooks', () => {
      it('throws error', () => {
        sinon.stub(gitService, 'initRepo').callsFake(() => { throw new Error('badness') })
        expect(() => subject.add('anything')).to.throw(Error)
      })
    })
  })

  describe('#remove', () => {
    let removeRepoStub

    beforeEach(() => {
      removeRepoStub = () => { }
      sinon.stub(gitService, 'removeRepo').callsFake(removeRepoStub)
      sinon.stub(configUtil, 'write')
    })
    afterEach(() => {
      gitService.removeRepo.restore()
      configUtil.write.restore()
    })

    it('removes the repo from config', () => {
      const repoToDelete = repos[1].path
      const expected = {
        repos: [repos[0]]
      }

      subject.remove(repoToDelete)

      expect(gitService.removeRepo).to.have.been.calledWith(repoToDelete)
      expect(configUtil.write).to.have.been.calledWith(expected)
    })

    describe('when repo is not in config', () => {
      it('does nothing', () => {
        subject.remove('/false/repo')
        expect(gitService.removeRepo).to.not.have.been.called
        expect(configUtil.write).to.not.have.been.called
      })
    })

    describe('when repo hooks are not configured', () => {
      it('does not call git service', () => {
        const repoToDelete = repos[0].path
        const expected = {
          repos: [repos[1]]
        }

        subject.remove(repoToDelete)

        expect(gitService.removeRepo).to.not.have.been.calledWith(repoToDelete)
        expect(configUtil.write).to.have.been.calledWith(expected)
      })
    })

    describe('when git service fails to remove repo hooks', () => {
      it('throws error', () => {
        removeRepoStub = () => { throw new Error('pure evil') }
        expect(() => subject.add('something')).to.throw(Error)
      })
    })
  })
})

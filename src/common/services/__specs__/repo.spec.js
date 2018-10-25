import { expect } from 'chai'

import * as configUtil from '../../utils/config'
import * as gitService from '../git'
import * as subject from '../repo'
import sandbox from '../../../../test/sandbox'

describe('services/repo', () => {
  let repos
  let config

  beforeEach(() => {
    repos = [
      { name: 'one', path: '/repo/one', isValid: false },
      { name: 'two', path: '/repo/two', isValid: true }
    ]
    config = { repos }
    sandbox.stub(configUtil, 'read').callsFake(() => config)
  })
  afterEach(() => {
    sandbox.restore()
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
      sandbox.stub(configUtil, 'write')
    })

    it('adds repo to config sorted by name', async () => {
      const newRepo = '/foo/bar'
      const expected = [
        { name: 'bar', path: newRepo, isValid: true },
        ...repos
      ]
      sandbox.stub(gitService, 'initRepo')

      const actual = await subject.add(newRepo)

      expect(gitService.initRepo).to.have.been.calledWith(newRepo)
      expect(configUtil.write).to.have.been.calledWith({ repos: expected })
      expect(actual).to.eql(expected)
    })

    describe('when a repo with the path already exists', () => {
      it('re-initializes the repo', async () => {
        const existingRepo = '/repo/one'
        sandbox.stub(gitService, 'initRepo')
        const expected = [
          { name: 'one', path: existingRepo, isValid: true },
          repos[1]
        ]

        const actual = await subject.add(existingRepo)

        expect(gitService.initRepo).to.have.been.calledWith(existingRepo)
        expect(configUtil.write).to.have.been.calledWith({ repos: expected })
        expect(actual).to.eql(expected)
      })
    })

    describe('when git service fails to init repo hooks', () => {
      it('adds the repo with isValid set to false', async () => {
        sandbox.stub(gitService, 'initRepo').callsFake(() => { throw new Error('badness') })
        const expected = [
          { name: 'bar-2', path: '/foo/bar-2', isValid: false },
          ...repos
        ]

        const actual = await subject.add('/foo/bar-2')

        expect(actual).to.eql(expected)
      })
    })
  })

  describe('#remove', () => {
    let removeRepoStub

    beforeEach(() => {
      removeRepoStub = () => { }
      sandbox.stub(gitService, 'removeRepo').callsFake(removeRepoStub)
      sandbox.stub(configUtil, 'write')
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
        expect(() => subject.removeRepo('something')).to.throw(Error)
      })
    })
  })
})

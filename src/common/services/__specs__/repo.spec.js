import { expect } from 'chai'

import { gitService, repoService as subject } from '../'
import sandbox from '../../../../test/sandbox'
import { config as configUtil } from '../../utils'

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
      expect(subject.get()).to.deep.equal(repos)
    })

    describe('when repos is null', () => {
      it('returns empty array', () => {
        config = {}
        expect(subject.get()).to.deep.equal([])
      })
    })
  })

  describe('#add', () => {
    let didRepoSucceed

    beforeEach(() => {
      didRepoSucceed = true

      sandbox.stub(configUtil, 'write')
      sandbox.stub(gitService, 'initRepo').callsFake(() => didRepoSucceed)
    })

    it('adds repo to config sorted by name', () => {
      const newRepo = '/foo/bar'
      const expected = [
        { name: 'bar', path: newRepo, isValid: true },
        ...repos
      ]

      const actual = subject.add(newRepo)

      expect(gitService.initRepo).to.have.been.calledWith(newRepo)
      expect(configUtil.write).to.have.been.calledWith({ repos: expected })
      expect(actual).to.deep.equal(expected)
    })

    describe('when a repo with the path already exists', () => {
      it('re-initializes the repo', () => {
        const existingRepo = '/repo/one'
        const expected = [
          { name: 'one', path: existingRepo, isValid: true },
          repos[1]
        ]

        const actual = subject.add(existingRepo)

        expect(gitService.initRepo).to.have.been.calledWith(existingRepo)
        expect(configUtil.write).to.have.been.calledWith({ repos: expected })
        expect(actual).to.deep.equal(expected)
      })
    })

    describe('when the repo has a trailing slash', () => {
      it('adds removes the trailing slash', () => {
        const newRepo = '/foo/bar/'
        const modifiedRepo = '/foo/bar'
        const expected = [
          { name: 'bar', path: modifiedRepo, isValid: true },
          ...repos
        ]

        const actual = subject.add(newRepo)

        expect(gitService.initRepo).to.have.been.calledWith(modifiedRepo)
        expect(configUtil.write).to.have.been.calledWith({ repos: expected })
        expect(actual).to.deep.equal(expected)
      })
    })

    describe('when using windows paths', () => {
      it('adds repo to config sorted by name', () => {
        const newRepo = 'C:\\foo\\bar'
        const expected = [
          { name: 'bar', path: newRepo, isValid: true },
          ...repos
        ]

        const actual = subject.add(newRepo)

        expect(gitService.initRepo).to.have.been.calledWith(newRepo)
        expect(configUtil.write).to.have.been.calledWith({ repos: expected })
        expect(actual).to.deep.equal(expected)
      })
    })

    describe('when git service fails to init repo hooks', () => {
      beforeEach(() => {
        didRepoSucceed = false
      })

      it('adds the repo with isValid set to false', () => {
        const expected = [
          { name: 'bar-2', path: '/foo/bar-2', isValid: false },
          ...repos
        ]

        const actual = subject.add('/foo/bar-2')

        expect(actual).to.deep.equal(expected)
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

    describe('when path has trailing slash', () => {
      it('removes the repo from config', () => {
        const normalizedPath = repos[1].path
        const repoToDelete = `${repos[1].path}/`
        const expected = {
          repos: [repos[0]]
        }

        subject.remove(repoToDelete)

        expect(gitService.removeRepo).to.have.been.calledWith(normalizedPath)
        expect(configUtil.write).to.have.been.calledWith(expected)
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

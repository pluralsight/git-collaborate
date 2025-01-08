import { expect } from 'chai'

import { gitService, repoService as subject } from '../'
import sandbox from '../../../../test/sandbox'
import { config as configUtil } from '../../utils'

describe('services/repo', () => {
  let repos
  let config

  beforeEach(() => {
    repos = [
      { name: 'one', path: '/repo/one', hooksPath: 'repo/one/.git/hooks', isValid: false },
      { name: 'two', path: '/repo/two', hooksPath: 'repo/two/.git/hooks', isValid: true }
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
    let repoPath
    let initRepoResult

    beforeEach(() => {
      repoPath = '/foo/bar'
      initRepoResult = { hooksPath: '/foo/bar/.git/hooks', isValid: true }

      sandbox.stub(configUtil, 'write')
      sandbox.stub(gitService, 'initRepo').callsFake(() => initRepoResult)
    })

    it('adds repo to config sorted by name', () => {
      const expected = [
        { name: 'bar', path: repoPath, hooksPath: initRepoResult.hooksPath, isValid: true },
        ...repos
      ]

      const actual = subject.add(repoPath)

      expect(gitService.initRepo).to.have.been.calledWith(repoPath)
      expect(configUtil.write).to.have.been.calledWith({ repos: expected })
      expect(actual).to.deep.equal(expected)
    })

    describe('when a repo with the path already exists', () => {
      beforeEach(() => {
        repoPath = '/repo/one'
        initRepoResult = { hooksPath: '/repo/one/.git/hooks', isValid: true }
      })

      it('re-initializes the repo', () => {
        const expected = [
          { name: 'one', path: repoPath, hooksPath: initRepoResult.hooksPath, isValid: true },
          repos[1]
        ]

        const actual = subject.add(repoPath)

        expect(gitService.initRepo).to.have.been.calledWith(repoPath)
        expect(configUtil.write).to.have.been.calledWith({ repos: expected })
        expect(actual).to.deep.equal(expected)
      })
    })

    describe('when the repo has a trailing slash', () => {
      beforeEach(() => {
        repoPath = '/foo/bar/'
      })

      it('adds removes the trailing slash', () => {
        const expectedPath = '/foo/bar'
        const expected = [
          { name: 'bar', path: expectedPath, hooksPath: initRepoResult.hooksPath, isValid: true },
          ...repos
        ]

        const actual = subject.add(repoPath)

        expect(gitService.initRepo).to.have.been.calledWith(expectedPath)
        expect(configUtil.write).to.have.been.calledWith({ repos: expected })
        expect(actual).to.deep.equal(expected)
      })
    })

    describe('when using windows paths', () => {
      beforeEach(() => {
        repoPath = 'C:\\foo\\bar'
        initRepoResult = { hooksPath: 'C:\\foo\\bar\\.git\\hooks', isValid: true }
      })

      it('adds repo to config sorted by name', () => {
        const expected = [
          { name: 'bar', path: repoPath, hooksPath: initRepoResult.hooksPath, isValid: true },
          ...repos
        ]

        const actual = subject.add(repoPath)

        expect(gitService.initRepo).to.have.been.calledWith(repoPath)
        expect(configUtil.write).to.have.been.calledWith({ repos: expected })
        expect(actual).to.deep.equal(expected)
      })
    })

    describe('when git service fails to init repo hooks', () => {
      beforeEach(() => {
        initRepoResult = { isValid: false }
      })

      it('adds the repo with isValid set to false', () => {
        const expected = [
          { name: 'bar-2', path: '/foo/bar-2', hooksPath: '', isValid: false },
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
      const hooksPath = repos[1].hooksPath
      const expected = {
        repos: [repos[0]]
      }

      subject.remove(repoToDelete)

      expect(gitService.removeRepo).to.have.been.calledWith(repoToDelete, hooksPath)
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
        const hooksPath = repos[1].hooksPath
        const repoToDelete = `${repos[1].path}/`
        const expected = {
          repos: [repos[0]]
        }

        subject.remove(repoToDelete)

        expect(gitService.removeRepo).to.have.been.calledWith(normalizedPath, hooksPath)
        expect(configUtil.write).to.have.been.calledWith(expected)
      })
    })

    describe('when repo hooks are not configured', () => {
      it('does not call git service', () => {
        const repoToDelete = repos[0].path
        const hooksPath = repos[0].hooksPath
        const expected = {
          repos: [repos[1]]
        }

        subject.remove(repoToDelete)

        expect(gitService.removeRepo).to.not.have.been.calledWith(repoToDelete, hooksPath)
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

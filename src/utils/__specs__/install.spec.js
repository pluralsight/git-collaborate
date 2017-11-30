import { expect } from 'chai'
import fs from 'fs'
import * as sinon from 'sinon'

import * as gitService from '../../client/services/git'
import * as repoService from '../../client/services/repo'

import subject, { GIT_SWITCH_PATH, CONFIG_FILE, POST_COMMIT_FILE, POST_COMMIT_GIT_SWITCH } from '../install'

describe('utils/install', () => {
  let gitSwitchDirExists
  let configFileExsists
  let postCommitFileExists
  let postCommitFileContents

  beforeEach(() => {
    gitSwitchDirExists = true
    configFileExsists = true
    postCommitFileExists = true
    postCommitFileContents = POST_COMMIT_GIT_SWITCH

    sinon.stub(fs, 'existsSync')
      .withArgs(GIT_SWITCH_PATH).callsFake(() => gitSwitchDirExists)
      .withArgs(CONFIG_FILE).callsFake(() => configFileExsists)
      .withArgs(POST_COMMIT_FILE).callsFake(() => postCommitFileExists)

    sinon.stub(fs, 'readFileSync')
      .withArgs(POST_COMMIT_FILE, 'utf-8').callsFake(() => postCommitFileContents)
  })
  afterEach(() => {
    fs.existsSync.restore()
    fs.readFileSync.restore()
  })

  describe('when config directory does not exist', () => {
    afterEach(() => {
      fs.mkdirSync.restore()
    })

    it('creates the .git-switch directory', () => {
      gitSwitchDirExists = false
      sinon.stub(fs, 'mkdirSync')

      subject()

      expect(fs.mkdirSync).to.have.been.calledWith(GIT_SWITCH_PATH)
    })
  })

  describe('when config files does not exist', () => {
    afterEach(() => {
      fs.writeFileSync.restore()
    })

    it('creates .git-switch/config.json', () => {
      configFileExsists = false
      sinon.stub(fs, 'writeFileSync')

      subject()

      expect(fs.writeFileSync).to.have.been.calledWith(CONFIG_FILE, JSON.stringify({ users: [], repos: [] }), 'utf-8')
    })
  })

  describe('when post-commit file does not exist', () => {
    beforeEach(() => {
      sinon.stub(repoService, 'get').returns([])
    })
    afterEach(() => {
      repoService.get.restore()
      fs.writeFileSync.restore()
    })

    it('creates .git-switch/post-commit', () => {
      postCommitFileExists = false
      sinon.stub(fs, 'writeFileSync')

      subject()

      expect(fs.writeFileSync).to.have.been.calledWith(POST_COMMIT_FILE, POST_COMMIT_GIT_SWITCH, 'utf-8')
    })
  })

  describe('when post-commit file is outdated', () => {
    beforeEach(() => {
      postCommitFileContents = 'outdated-content-here'

      sinon.stub(gitService, 'initRepo')
      sinon.stub(repoService, 'get').returns([ { path: 'repo/one' }, { path: 'repo/two' } ])
    })
    afterEach(() => {
      gitService.initRepo.restore()
      repoService.get.restore()
      fs.writeFileSync.restore()
    })

    it('updates .git-switch/post-commit', () => {
      sinon.stub(fs, 'writeFileSync')

      subject()

      expect(fs.writeFileSync).to.have.been.calledWith(POST_COMMIT_FILE, POST_COMMIT_GIT_SWITCH, 'utf-8')
    })

    it('re-initializes all the repos', () => {
      sinon.stub(fs, 'writeFileSync')

      subject()

      expect(gitService.initRepo).to.have.been.calledWith('repo/one')
      expect(gitService.initRepo).to.have.been.calledWith('repo/two')
      expect(gitService.initRepo).to.have.been.calledTwice
    })
  })
})

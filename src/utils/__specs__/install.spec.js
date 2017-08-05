import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'
import * as sinon from 'sinon'

import subject from '../install'

const GIT_SWITCH_PATH = path.join(os.homedir(), '.git-switch')
const HOOKS_PATH = path.join(GIT_SWITCH_PATH, 'hooks')
const POST_COMMIT_FILE = path.join(HOOKS_PATH, 'post-commit.git-switch')
const CONFIG_FILE = path.join(GIT_SWITCH_PATH, 'config.json')

describe('utils/install', () => {
  let gitSwitchDirExists
  let hooksDirExists
  let postCommitFileExists
  let configFileExsists

  beforeEach(() => {
    gitSwitchDirExists = true
    hooksDirExists = true
    postCommitFileExists = true
    configFileExsists = true

    sinon.stub(fs, 'existsSync')
      .withArgs(GIT_SWITCH_PATH).callsFake(() => gitSwitchDirExists)
      .withArgs(HOOKS_PATH).callsFake(() => hooksDirExists)
      .withArgs(POST_COMMIT_FILE).callsFake(() => postCommitFileExists)
      .withArgs(CONFIG_FILE).callsFake(() => configFileExsists)
  })
  afterEach(() => {
    fs.existsSync.restore()
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

      expect(fs.writeFileSync).to.have.been.calledWith(CONFIG_FILE, JSON.stringify({ users: [], repos: [] }))
    })
  })
})

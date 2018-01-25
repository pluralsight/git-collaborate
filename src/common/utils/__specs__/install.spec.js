import { expect } from 'chai'
import fs from 'fs'
import * as sinon from 'sinon'

import * as repoService from '../../services/repo'

import subject, { GIT_SWITCH_PATH, CONFIG_FILE, POST_COMMIT_FILE } from '../install'

function getPostCommitFileContents(autoRotate) {
  return `#!/bin/sh

actual_author=$(git log -1 HEAD --format="%an")
expected_author=$(git config --global author.name)
expected_author_email=$(git config --global author.email)
committers=$(git config --global user.name)

if [ "$actual_author" != "$expected_author" ]; then
  echo "git-switch > Author: $expected_author"
  echo "git-switch > Committer(s): $committers"
  echo ""

  git commit --amend --no-verify --no-edit --author="$expected_author <$expected_author_email>"
  echo ""
  echo "git-switch > Rotating author and committer(s)"
  ${autoRotate}
fi
`
}

describe('utils/install', () => {
  let gitSwitchDirExists
  let configFileExsists
  let postCommitFileExists
  let appExecutablePath
  let autoRotate
  let platform
  let postCommitFileContents

  beforeEach(() => {
    gitSwitchDirExists = true
    configFileExsists = true
    postCommitFileExists = true
    appExecutablePath = '/foo/bar'
    autoRotate = '/foo/bar rotate > /dev/null 2>&1 &'
    platform = 'linux'
    postCommitFileContents = getPostCommitFileContents(autoRotate)

    sinon.stub(fs, 'existsSync')
      .withArgs(GIT_SWITCH_PATH).callsFake(() => gitSwitchDirExists)
      .withArgs(CONFIG_FILE).callsFake(() => configFileExsists)
      .withArgs(POST_COMMIT_FILE).callsFake(() => postCommitFileExists)
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

      subject(platform, appExecutablePath)

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

      subject(platform, appExecutablePath)

      expect(fs.writeFileSync).to.have.been.calledWith(CONFIG_FILE, JSON.stringify({ users: [], repos: [] }), 'utf-8')
    })
  })

  describe('when post-commit file does not exist', () => {
    beforeEach(() => {
      postCommitFileExists = false
      sinon.stub(repoService, 'get').returns([])
      sinon.stub(fs, 'writeFileSync')
    })
    afterEach(() => {
      repoService.get.restore()
      fs.writeFileSync.restore()
    })

    it('creates .git-switch/post-commit', () => {
      subject(platform, appExecutablePath)
      expect(fs.writeFileSync).to.have.been.calledWith(POST_COMMIT_FILE, postCommitFileContents, 'utf-8')
    })

    describe('when app executable is electron', () => {
      beforeEach(() => {
        appExecutablePath = '/herp/derp/node_modules/electron-prebuilt-compile/node_modules/dist/electron'
        autoRotate = `cd /herp/derp
  npm run start --- -- rotate
  cd $(dirname $0)/../../`
        postCommitFileContents = getPostCommitFileContents(autoRotate)
      })

      it('the post-commit file auto rotates by changing dirs and running npm', () => {
        subject(platform, appExecutablePath)
        expect(fs.writeFileSync).to.have.been.calledWith(POST_COMMIT_FILE, postCommitFileContents, 'utf-8')
      })
    })

    describe('when platform is windows', () => {
      beforeEach(() => {
        platform = 'win32'
        appExecutablePath = 'C:\\foo\\bar'
        autoRotate = 'start C:\\\\foo\\\\bar rotate'
        postCommitFileContents = getPostCommitFileContents(autoRotate)
      })

      it('escapes and backgrounds the autoRotate specific to the platform', () => {
        subject(platform, appExecutablePath)
        expect(fs.writeFileSync).to.have.been.calledWith(POST_COMMIT_FILE, postCommitFileContents, 'utf-8')
      })
    })
  })

  describe('when post-commit file is outdated', () => {
    let existingPostCommitFileContents

    beforeEach(() => {
      existingPostCommitFileContents = 'outdated-content-here'
      sinon.stub(repoService, 'add')
      sinon.stub(repoService, 'get').returns([{ path: 'repo/one' }, { path: 'repo/two' }])
      sinon.stub(fs, 'writeFileSync')
      sinon.stub(fs, 'readFileSync').callsFake(() => existingPostCommitFileContents)
    })
    afterEach(() => {
      repoService.add.restore()
      repoService.get.restore()
      fs.writeFileSync.restore()
      fs.readFileSync.restore()
    })

    it('updates .git-switch/post-commit', () => {
      subject(platform, appExecutablePath)
      expect(fs.writeFileSync).to.have.been.calledWith(POST_COMMIT_FILE, postCommitFileContents, 'utf-8')
    })

    it('re-initializes all the repos', () => {
      subject(platform, appExecutablePath)

      expect(repoService.add).to.have.been.calledWith('repo/one')
      expect(repoService.add).to.have.been.calledWith('repo/two')
      expect(repoService.add).to.have.been.calledTwice
    })
  })
})

import { expect } from 'chai'
import fs from 'fs'

import { install as subject, GIT_LOG_CO_AUTHOR_FILE, GIT_COLLAB_PATH, CONFIG_FILE, GIT_SWITCH_CONFIG_FILE, POST_COMMIT_FILE, getGitLogCoAuthorScript, getPostCommitHookScript } from '../'
import * as versionUtil from '../version'
import sandbox from '../../../../test/sandbox'
import { gitService, notificationService, repoService, userService } from '../../services'

const sleep = async (ms) => await new Promise(
  (resolve) => setTimeout(() => resolve(), ms)
)

describe('utils/install', () => {
  let appVersion
  let latestVersion
  let gitCollabDirExists
  let configFileExists
  let oldConfigFileExists
  let postCommitFileExists
  let gitLogCoAuthorFileExists
  let appExecutablePath
  let autoRotate
  let platform
  let postCommitFileContents
  let gitLogCoAuthorFileContents
  let existingGitSwitchConfigFileContents
  let existingPostCommitFileContents
  let existingGitLogCoAuthorFileContents
  let existingRepos
  let users

  beforeEach(() => {
    appVersion = '1.0.0'
    latestVersion = appVersion
    gitCollabDirExists = true
    configFileExists = true
    oldConfigFileExists = false
    postCommitFileExists = true
    gitLogCoAuthorFileExists = true
    appExecutablePath = '/foo/bar'
    autoRotate = '/foo/bar users rotate > /dev/null 2>&1 &'
    platform = 'linux'
    existingGitSwitchConfigFileContents = JSON.stringify({ users: [{ id: 'abcd1234', name: 'Homer Simpson', email: 'chunkylover53@aol.com' }], repos: [] })
    postCommitFileContents = getPostCommitHookScript(autoRotate)
    gitLogCoAuthorFileContents = getGitLogCoAuthorScript()
    existingPostCommitFileContents = postCommitFileContents
    existingGitLogCoAuthorFileContents = gitLogCoAuthorFileContents
    existingRepos = []
    users = []

    sandbox.stub(versionUtil, 'getLatestVersion').callsFake(async () => await latestVersion)
    sandbox.stub(fs, 'existsSync')
      .withArgs(GIT_COLLAB_PATH).callsFake(() => gitCollabDirExists)
      .withArgs(CONFIG_FILE).callsFake(() => configFileExists)
      .withArgs(GIT_SWITCH_CONFIG_FILE).callsFake(() => oldConfigFileExists)
      .withArgs(POST_COMMIT_FILE).callsFake(() => postCommitFileExists)
      .withArgs(GIT_LOG_CO_AUTHOR_FILE).callsFake(() => gitLogCoAuthorFileExists)
    sandbox.stub(fs, 'readFileSync')
      .withArgs(POST_COMMIT_FILE).callsFake(() => existingPostCommitFileContents)
      .withArgs(GIT_LOG_CO_AUTHOR_FILE).callsFake(() => existingGitLogCoAuthorFileContents)
      .withArgs(GIT_SWITCH_CONFIG_FILE).callsFake(() => existingGitSwitchConfigFileContents)
    sandbox.stub(repoService, 'get').callsFake(() => existingRepos)
    sandbox.stub(repoService, 'update')
    sandbox.stub(userService, 'get').callsFake(() => users)
    sandbox.stub(notificationService, 'showUpdateAvailable')
    sandbox.stub(userService, 'shortenUserIds')
    sandbox.stub(gitService, 'updateAuthorAndCoAuthors')
    sandbox.stub(gitService, 'setGitLogAlias')
  })
  afterEach(() => {
    sandbox.restore()
  })

  describe('when app version is different from latest release', () => {
    it('sends notification', async () => {
      latestVersion = { data: { name: '1.1.1' } }

      subject(platform, appExecutablePath, appVersion)
      // Added a pause here because the version check is fire and forget
      await sleep(10)

      expect(notificationService.showUpdateAvailable).to.have.been.called
    })
  })

  describe('when app version matches latest release', () => {
    it('does nothing', async () => {
      subject(platform, appExecutablePath, appVersion)
      await sleep(10)

      expect(notificationService.showUpdateAvailable).to.not.have.been.called
    })
  })

  describe('when config directory does not exist', () => {
    it('creates the .git-collab directory', () => {
      gitCollabDirExists = false
      sandbox.stub(fs, 'mkdirSync')

      subject(platform, appExecutablePath, appVersion)

      expect(fs.mkdirSync).to.have.been.calledWith(GIT_COLLAB_PATH, { mode: 0o755 })
    })
  })

  describe('when config file does not exist', () => {
    beforeEach(() => {
      configFileExists = false

      sandbox.stub(fs, 'writeFileSync')
    })

    it('creates .git-collab/config.json', () => {
      subject(platform, appExecutablePath, appVersion)

      expect(fs.writeFileSync).to.have.been.calledWith(CONFIG_FILE, JSON.stringify({ users: [], repos: [] }), { encoding: 'utf-8', mode: 0o644 })
    })

    describe('when git-switch config file exists', () => {
      it('copies git-switch config to git-collab', () => {
        oldConfigFileExists = true

        subject(platform, appExecutablePath, appVersion)

        expect(fs.writeFileSync).to.have.been.calledWith(CONFIG_FILE, existingGitSwitchConfigFileContents, { encoding: 'utf-8', mode: 0o644 })
      })
    })
  })

  describe('when post-commit file does not exist', () => {
    beforeEach(() => {
      postCommitFileExists = false

      sandbox.stub(fs, 'writeFileSync')
    })

    it('creates .git-collab/post-commit', () => {
      subject(platform, appExecutablePath, appVersion)
      expect(fs.writeFileSync).to.have.been.calledWith(POST_COMMIT_FILE, postCommitFileContents, { encoding: 'utf-8', mode: 0o755 })
    })

    describe('when app executable is electron', () => {
      beforeEach(() => {
        appExecutablePath = '/herp/derp/node_modules/electron-prebuilt-compile/node_modules/dist/electron'
        autoRotate = `cd /herp/derp
  npm run start -- -- users rotate
  cd $(dirname $0)/../../`
        postCommitFileContents = getPostCommitHookScript(autoRotate)
      })

      it('the post-commit file auto rotates by changing dirs and running npm', () => {
        subject(platform, appExecutablePath, appVersion)
        expect(fs.writeFileSync).to.have.been.calledWith(POST_COMMIT_FILE, postCommitFileContents, { encoding: 'utf-8', mode: 0o755 })
      })

      it('ignores case on electron path basename', () => {
        appExecutablePath = '/herp/derp/node_modules/electron-prebuilt-compile/node_modules/dist/Electron'
        subject(platform, appExecutablePath, appVersion)
        expect(fs.writeFileSync).to.have.been.calledWith(POST_COMMIT_FILE, postCommitFileContents, { encoding: 'utf-8', mode: 0o755 })
      })
    })

    describe('when platform is windows', () => {
      beforeEach(() => {
        platform = 'win32'
        appExecutablePath = 'C:\\foo\\bar'
        autoRotate = 'start C:\\\\foo\\\\bar users rotate'
        postCommitFileContents = getPostCommitHookScript(autoRotate)
      })

      it('escapes and backgrounds the autoRotate specific to the platform', () => {
        subject(platform, appExecutablePath, appVersion)
        expect(fs.writeFileSync).to.have.been.calledWith(POST_COMMIT_FILE, postCommitFileContents, { encoding: 'utf-8', mode: 0o755 })
      })
    })
  })

  describe('when the config file exists', () => {
    let repoOneInitResult
    let repoTwoInitResult

    beforeEach(() => {
      existingRepos = [
        { path: 'repo/one', hooksPath: 'repo/one/.git/hooks', name: 'one', isValid: true },
        { path: 'repo/two', hooksPath: 'repo/two/.git/hooks', name: 'two', isValid: true }
      ]
      repoOneInitResult = { hooksPath: 'repo/one/.git/hooks', isValid: true }
      repoTwoInitResult = { hooksPath: 'repo/two/.git/hooks', isValid: true }
      sandbox.stub(gitService, 'initRepo')
        .withArgs(existingRepos[0].path).callsFake(() => repoOneInitResult)
        .withArgs(existingRepos[1].path).callsFake(() => repoTwoInitResult)
      sandbox.stub(fs, 'writeFileSync')
    })

    it('re-initializes all the repos', () => {
      subject(platform, appExecutablePath, appVersion)

      expect(gitService.initRepo).to.have.been.calledWith(existingRepos[0].path)
      expect(gitService.initRepo).to.have.been.calledWith(existingRepos[1].path)
      expect(gitService.initRepo).to.have.been.calledTwice
    })

    it('initializes authors/co-authors in .gitconfig', () => {
      subject(platform, appExecutablePath, appVersion)
      expect(userService.get).to.have.been.called
      expect(gitService.updateAuthorAndCoAuthors).to.have.been.calledWith(users)
    })

    describe('when post-commit file is outdated', () => {
      beforeEach(() => {
        existingPostCommitFileContents = 'outdated-content-here'
      })

      it('updates .git-collab/post-commit', () => {
        subject(platform, appExecutablePath, appVersion)
        expect(fs.writeFileSync).to.have.been.calledWith(POST_COMMIT_FILE, postCommitFileContents, { encoding: 'utf-8', mode: 0o755 })
      })

      it('re-initializes all the repos', () => {
        subject(platform, appExecutablePath, appVersion)

        expect(gitService.initRepo).to.have.been.calledWith(existingRepos[0].path)
        expect(gitService.initRepo).to.have.been.calledWith(existingRepos[1].path)
        expect(gitService.initRepo).to.have.been.calledTwice
      })

      it('initializes authors/co-authors in .gitconfig', () => {
        subject(platform, appExecutablePath, appVersion)
        expect(userService.get).to.have.been.called
        expect(gitService.updateAuthorAndCoAuthors).to.have.been.calledWith(users)
      })
    })

    describe('when git-log-co-author file does not exist', () => {
      beforeEach(() => {
        gitLogCoAuthorFileExists = false
      })

      it('creates .git-collab/git-log-co-authors', () => {
        subject(platform, appExecutablePath, appVersion)
        expect(fs.writeFileSync).to.have.been.calledWith(GIT_LOG_CO_AUTHOR_FILE, gitLogCoAuthorFileContents, { encoding: 'utf-8', mode: 0o755 })
      })

      it('creates a git log alias', () => {
        subject(platform, appExecutablePath, appVersion)
        expect(gitService.setGitLogAlias).to.have.been.calledWith(GIT_LOG_CO_AUTHOR_FILE)
      })
    })

    describe('when git-log-co-author exists', () => {
      it('does not create .git-collab/git-log-co-authors', () => {
        subject(platform, appExecutablePath, appVersion)
        expect(fs.writeFileSync).to.not.have.been.calledWith(GIT_LOG_CO_AUTHOR_FILE, gitLogCoAuthorFileContents, { encoding: 'utf-8', mode: 0o755 })
      })

      it('creates a git log alias', () => {
        subject(platform, appExecutablePath, appVersion)
        expect(gitService.setGitLogAlias).to.have.been.calledWith(GIT_LOG_CO_AUTHOR_FILE)
      })
    })

    describe('when git-log-co-author is outdated', () => {
      beforeEach(() => {
        existingGitLogCoAuthorFileContents = 'outdated-content-here'
      })

      it('creates .git-collab/git-log-co-authors', () => {
        subject(platform, appExecutablePath, appVersion)
        expect(fs.writeFileSync).to.have.been.calledWith(GIT_LOG_CO_AUTHOR_FILE, gitLogCoAuthorFileContents, { encoding: 'utf-8', mode: 0o755 })
      })

      it('creates a git log alias', () => {
        subject(platform, appExecutablePath, appVersion)
        expect(gitService.setGitLogAlias).to.have.been.calledWith(GIT_LOG_CO_AUTHOR_FILE)
      })
    })

    describe('when repo init returns updated result', () => {
      beforeEach(() => {
        existingRepos = [
          { hooksPath: 'repo/one/.git/hooks', isValid: false, name: 'one', path: 'repo/one' },
          { hooksPath: 'repo/two/.git/hooks', isValid: true, name: 'two', path: 'repo/two' }
        ]
        repoOneInitResult = { hooksPath: 'repo/one/.git/hooks', isValid: true }
        repoTwoInitResult = { hooksPath: 'repo/two/.some-tool/hooks', isValid: true }
      })

      it('updates the repos', () => {
        subject(platform, appExecutablePath, appVersion)
        expect(repoService.update).to.have.been.calledWith([
          { hooksPath: 'repo/one/.git/hooks', isValid: true, name: 'one', path: 'repo/one' },
          { hooksPath: 'repo/two/.some-tool/hooks', isValid: true, path: 'repo/two', name: 'two' }
        ])
      })
    })
  })
})

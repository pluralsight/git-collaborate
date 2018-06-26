import { expect } from 'chai'
import fs from 'fs'
import * as sinon from 'sinon'

import * as gitService from '../../services/git'
import subject, { GIT_SWITCH_PATH, CONFIG_FILE, POST_COMMIT_FILE } from '../install'
import * as repoService from '../../services/repo'
import * as userService from '../../services/user'

function getPostCommitFileContents(autoRotate) {
  return `#!/bin/sh

body=$(git log -1 HEAD --format="%b")
co_authors=$(git config --global git-switch.co-authors)

if [[ "$body" != *$co_authors ]]; then
  subject=$(git log -1 HEAD --format="%s")
  author=$(git log -1 HEAD --format="%an <%ae>")

  echo -e "git-switch > Author:\\n  $author"
  echo -e "git-switch > Co-Author(s):\\n\${co_authors//Co-Authored-By:/ }"
  echo ""

  if [[ "$body" == Co-Authored-By* ]]; then
    body=$co_authors
  else
    body=\${body//Co-Authored-By*/}
    body="$body\n\n$co_authors"
  fi

  git commit --amend --no-verify --message="$subject\n\n$body"

  echo ""
  echo "git-switch > Rotating author and co-author(s)"
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
  let existingPostCommitFileContents
  let existingRepos
  let users

  beforeEach(() => {
    gitSwitchDirExists = true
    configFileExsists = true
    postCommitFileExists = true
    appExecutablePath = '/foo/bar'
    autoRotate = '/foo/bar rotate > /dev/null 2>&1 &'
    platform = 'linux'
    postCommitFileContents = getPostCommitFileContents(autoRotate)
    existingPostCommitFileContents = postCommitFileContents
    existingRepos = []
    users = []

    sinon.stub(fs, 'existsSync')
      .withArgs(GIT_SWITCH_PATH).callsFake(() => gitSwitchDirExists)
      .withArgs(CONFIG_FILE).callsFake(() => configFileExsists)
      .withArgs(POST_COMMIT_FILE).callsFake(() => postCommitFileExists)
    sinon.stub(fs, 'readFileSync').callsFake(() => existingPostCommitFileContents)
    sinon.stub(repoService, 'get').callsFake(() => existingRepos)
    sinon.stub(userService, 'get').callsFake(() => users)
    sinon.stub(gitService, 'updateAuthorAndCoAuthors')
  })
  afterEach(() => {
    fs.existsSync.restore()
    fs.readFileSync.restore()
    repoService.get.restore()
    userService.get.restore()
    gitService.updateAuthorAndCoAuthors.restore()
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

      sinon.stub(fs, 'writeFileSync')
    })
    afterEach(() => {
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

      it('ignores case on electron path basename', async () => {
        appExecutablePath = '/herp/derp/node_modules/electron-prebuilt-compile/node_modules/dist/Electron'
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

  describe('when the config file exists', () => {
    beforeEach(() => {
      existingRepos = [{ path: 'repo/one' }, { path: 'repo/two' }]
      sinon.stub(repoService, 'add')
    })
    afterEach(() => {
      repoService.add.restore()
    })

    it('re-initializes all the repos', () => {
      subject(platform, appExecutablePath)

      expect(repoService.add).to.have.been.calledWith('repo/one')
      expect(repoService.add).to.have.been.calledWith('repo/two')
      expect(repoService.add).to.have.been.calledTwice
    })

    it('initializes authors/co-authors in .gitconfig', () => {
      subject(platform, appExecutablePath)
      expect(userService.get).to.have.been.called
      expect(gitService.updateAuthorAndCoAuthors).to.have.been.calledWith(users)
    })

    describe('when post-commit file is outdated', () => {
      beforeEach(() => {
        existingPostCommitFileContents = 'outdated-content-here'
        sinon.stub(fs, 'writeFileSync')
      })
      afterEach(() => {
        fs.writeFileSync.restore()
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

      it('initializes authors/co-authors in .gitconfig', () => {
        subject(platform, appExecutablePath)
        expect(userService.get).to.have.been.called
        expect(gitService.updateAuthorAndCoAuthors).to.have.been.calledWith(users)
      })
    })
  })
})

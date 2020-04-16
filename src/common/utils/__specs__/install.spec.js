import { expect } from 'chai'
import fs from 'fs'

import { install as subject, GIT_LOG_CO_AUTHOR_FILE, GIT_SWITCH_PATH, CONFIG_FILE, POST_COMMIT_FILE } from '../'
import sandbox from '../../../../test/sandbox'
import { gitService, repoService, userService } from '../../services'

describe('utils/install', () => {
  let gitSwitchDirExists
  let configFileExists
  let postCommitFileExists
  let gitLogCoAuthorFileExists
  let appExecutablePath
  let autoRotate
  let platform
  let postCommitFileContents
  let gitLogCoAuthorFileContents
  let existingPostCommitFileContents
  let existingGitLogCoAuthorFileContents
  let existingRepos
  let users

  beforeEach(() => {
    gitSwitchDirExists = true
    configFileExists = true
    postCommitFileExists = true
    gitLogCoAuthorFileExists = true
    appExecutablePath = '/foo/bar'
    autoRotate = '/foo/bar users rotate > /dev/null 2>&1 &'
    platform = 'linux'
    postCommitFileContents = getPostCommitFileContents(autoRotate)
    gitLogCoAuthorFileContents = getGitLogCoAuthorFileContents()
    existingPostCommitFileContents = postCommitFileContents
    existingGitLogCoAuthorFileContents = gitLogCoAuthorFileContents
    existingRepos = []
    users = []

    sandbox.stub(fs, 'existsSync')
      .withArgs(GIT_SWITCH_PATH).callsFake(() => gitSwitchDirExists)
      .withArgs(CONFIG_FILE).callsFake(() => configFileExists)
      .withArgs(POST_COMMIT_FILE).callsFake(() => postCommitFileExists)
      .withArgs(GIT_LOG_CO_AUTHOR_FILE).callsFake(() => gitLogCoAuthorFileExists)
    sandbox.stub(fs, 'readFileSync')
      .withArgs(POST_COMMIT_FILE).callsFake(() => existingPostCommitFileContents)
      .withArgs(GIT_LOG_CO_AUTHOR_FILE).callsFake(() => existingGitLogCoAuthorFileContents)
    sandbox.stub(repoService, 'get').callsFake(() => existingRepos)
    sandbox.stub(userService, 'get').callsFake(() => users)
    sandbox.stub(userService, 'shortenUserIds')
    sandbox.stub(gitService, 'updateAuthorAndCoAuthors')
    sandbox.stub(gitService, 'setGitLogAlias')
  })
  afterEach(() => {
    sandbox.restore()
  })

  describe('when config directory does not exist', () => {
    it('creates the .git-switch directory', () => {
      gitSwitchDirExists = false
      sandbox.stub(fs, 'mkdirSync')

      subject(platform, appExecutablePath)

      expect(fs.mkdirSync).to.have.been.calledWith(GIT_SWITCH_PATH, 0o755)
    })
  })

  describe('when config file does not exist', () => {
    it('creates .git-switch/config.json', () => {
      configFileExists = false
      sandbox.stub(fs, 'writeFileSync')

      subject(platform, appExecutablePath)

      expect(fs.writeFileSync).to.have.been.calledWith(CONFIG_FILE, JSON.stringify({ users: [], repos: [] }), { encoding: 'utf-8', mode: 0o644 })
    })
  })

  describe('when post-commit file does not exist', () => {
    beforeEach(() => {
      postCommitFileExists = false

      sandbox.stub(fs, 'writeFileSync')
    })

    it('creates .git-switch/post-commit', () => {
      subject(platform, appExecutablePath)
      expect(fs.writeFileSync).to.have.been.calledWith(POST_COMMIT_FILE, postCommitFileContents, { encoding: 'utf-8', mode: 0o755 })
    })

    describe('when app executable is electron', () => {
      beforeEach(() => {
        appExecutablePath = '/herp/derp/node_modules/electron-prebuilt-compile/node_modules/dist/electron'
        autoRotate = `cd /herp/derp
  npm run start -- -- users rotate
  cd $(dirname $0)/../../`
        postCommitFileContents = getPostCommitFileContents(autoRotate)
      })

      it('the post-commit file auto rotates by changing dirs and running npm', () => {
        subject(platform, appExecutablePath)
        expect(fs.writeFileSync).to.have.been.calledWith(POST_COMMIT_FILE, postCommitFileContents, { encoding: 'utf-8', mode: 0o755 })
      })

      it('ignores case on electron path basename', () => {
        appExecutablePath = '/herp/derp/node_modules/electron-prebuilt-compile/node_modules/dist/Electron'
        subject(platform, appExecutablePath)
        expect(fs.writeFileSync).to.have.been.calledWith(POST_COMMIT_FILE, postCommitFileContents, { encoding: 'utf-8', mode: 0o755 })
      })
    })

    describe('when platform is windows', () => {
      beforeEach(() => {
        platform = 'win32'
        appExecutablePath = 'C:\\foo\\bar'
        autoRotate = 'start C:\\\\foo\\\\bar users rotate'
        postCommitFileContents = getPostCommitFileContents(autoRotate)
      })

      it('escapes and backgrounds the autoRotate specific to the platform', () => {
        subject(platform, appExecutablePath)
        expect(fs.writeFileSync).to.have.been.calledWith(POST_COMMIT_FILE, postCommitFileContents, { encoding: 'utf-8', mode: 0o755 })
      })
    })
  })

  describe('when the config file exists', () => {
    beforeEach(() => {
      existingRepos = [{ path: 'repo/one' }, { path: 'repo/two' }]
      sandbox.stub(gitService, 'initRepo')
      sandbox.stub(fs, 'writeFileSync')
    })

    it('re-initializes all the repos', () => {
      subject(platform, appExecutablePath)

      expect(gitService.initRepo).to.have.been.calledWith('repo/one')
      expect(gitService.initRepo).to.have.been.calledWith('repo/two')
      expect(gitService.initRepo).to.have.been.calledTwice
    })

    it('initializes authors/co-authors in .gitconfig', () => {
      subject(platform, appExecutablePath)
      expect(userService.get).to.have.been.called
      expect(gitService.updateAuthorAndCoAuthors).to.have.been.calledWith(users)
    })

    describe('when post-commit file is outdated', () => {
      beforeEach(() => {
        existingPostCommitFileContents = 'outdated-content-here'
      })

      it('updates .git-switch/post-commit', () => {
        subject(platform, appExecutablePath)
        expect(fs.writeFileSync).to.have.been.calledWith(POST_COMMIT_FILE, postCommitFileContents, { encoding: 'utf-8', mode: 0o755 })
      })

      it('re-initializes all the repos', () => {
        subject(platform, appExecutablePath)

        expect(gitService.initRepo).to.have.been.calledWith('repo/one')
        expect(gitService.initRepo).to.have.been.calledWith('repo/two')
        expect(gitService.initRepo).to.have.been.calledTwice
      })

      it('initializes authors/co-authors in .gitconfig', () => {
        subject(platform, appExecutablePath)
        expect(userService.get).to.have.been.called
        expect(gitService.updateAuthorAndCoAuthors).to.have.been.calledWith(users)
      })
    })

    describe('when git-log-co-author file does not exist', () => {
      beforeEach(() => {
        gitLogCoAuthorFileExists = false
      })

      it('creates .git-switch/git-log-co-authors', () => {
        subject(platform, appExecutablePath)
        expect(fs.writeFileSync).to.have.been.calledWith(GIT_LOG_CO_AUTHOR_FILE, gitLogCoAuthorFileContents, { encoding: 'utf-8', mode: 0o755 })
      })

      it('creates a git log alias', () => {
        subject(platform, appExecutablePath)
        expect(gitService.setGitLogAlias).to.have.been.calledWith(GIT_LOG_CO_AUTHOR_FILE)
      })
    })

    describe('when git-log-co-author is outdated', () => {
      beforeEach(() => {
        existingGitLogCoAuthorFileContents = 'outdated-content-here'
      })

      it('creates .git-switch/git-log-co-authors', () => {
        subject(platform, appExecutablePath)
        expect(fs.writeFileSync).to.have.been.calledWith(GIT_LOG_CO_AUTHOR_FILE, gitLogCoAuthorFileContents, { encoding: 'utf-8', mode: 0o755 })
      })

      it('creates a git log alias', () => {
        subject(platform, appExecutablePath)
        expect(gitService.setGitLogAlias).to.have.been.calledWith(GIT_LOG_CO_AUTHOR_FILE)
      })
    })

    describe('when git-log-co-author exists', () => {
      it('creates a git log alias', () => {
        subject(platform, appExecutablePath)
        expect(gitService.setGitLogAlias).to.have.been.calledWith(GIT_LOG_CO_AUTHOR_FILE)
      })
    })
  })
})

function getPostCommitFileContents(autoRotate) {
  return `#!/bin/sh

body=$(git log -1 HEAD --format="%b")
author=$(git log -1 HEAD --format="%an <%ae>")
co_authors_string=$(git config --global git-switch.co-authors)
co_authors=$(echo $co_authors_string | tr ";" "\n")

echo -e "git-switch > Author:\\n  $author"

if [[ "$body" != *$co_authors ]]; then
  subject=$(git log -1 HEAD --format="%s")

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

function getGitLogCoAuthorFileContents() {
  return `#!/bin/bash

# Pretty formatting for git logs with github's co-author support.

commitHash=''
nextHash=''
author=''
date=''
description=''
summary=''
coAuthors=()

us=$'\\037'
OIFS=$IFS
RED='\\033[01;31m'
GREEN='\\033[01;32m'
YELLOW='\\033[01;33m'
BLUE='\\033[01;34m'
MAGEN='\\033[01;35m'
CYAN='\\033[01;36m'
WHITE='\\033[01;37m'

function main {
  git log --date=short --pretty=format:"commitHash %h$us(%ad, %ar)$us%d$us%s$us<%an>$us%b" |
  sed '/^[[:blank:]]*$/d' |
  parseGitLog |
  less -R
}

function parseGitLog {
  IFS=$us
  while read data
  do
    if [[ $data =~ (commitHash )(.*) ]]; then
      a=($data)
      nextHash=$( echo \${a[0]} | sed -e "s/commitHash \\(.*\\)/\\1/" );
      if [[ $nextHash != $commitHash ]] && [[ $commitHash != '' ]]; then
        printCommit
      fi
      commitHash=$nextHash
      date=\${a[1]}
      branch=\${a[2]}
      summary=\${a[3]}
      author=\${a[4]}
      coAuthors=()
      possibleCoAuthor=\${a[5]}
    else
      possibleCoAuthor=$data
    fi
    extractCoAuthor $possibleCoAuthor
  done

  printCommit
  IFS=$OIFS
}

function extractCoAuthor {
  if [[ $1 =~ (Co-Authored-By: )(.*)( <.*) ]]; then
    authorFound=\${BASH_REMATCH[2]}
    coAuthors+=($authorFound)
  fi
}

function printCommit {
  if [ \${#coAuthors[@]} -eq 0 ]; then
    coAuthors=''
  else
    CIFS=$IFS
    IFS=$OIFS
    coAuthors=$(join_by ', ' "\${coAuthors[@]}")
    IFS=$CIFS
    coAuthors="($coAuthors)"
  fi
  echo -e "\${CYAN}$commitHash \${YELLOW}$date \${WHITE}-\${MAGEN}$branch \${WHITE}$summary \${BLUE}$author \${GREEN}$coAuthors"
}

function join_by { local d=$1; shift; echo -n "$1"; shift; printf "%s" "\${@/#/$d}"; }

main
`
}

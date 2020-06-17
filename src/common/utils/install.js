import fs from 'fs'
import os from 'os'
import path from 'path'

import { getLatestVersion, logger } from '.'
import { gitService, notificationService, repoService, userService } from '../services'

export const GIT_COLLAB_PATH = path.join(os.homedir(), '.git-collab')
export const CONFIG_FILE = path.join(GIT_COLLAB_PATH, 'config.json')
export const POST_COMMIT_FILE = path.join(GIT_COLLAB_PATH, 'post-commit')
export const GIT_LOG_CO_AUTHOR_FILE = path.join(GIT_COLLAB_PATH, 'git-log-co-author')

export function install(platform, appExecutablePath, appVersion) {
  checkForNewerVersion(appVersion)

  installConfigFile()

  userService.shortenUserIds()

  const autoRotate = getAutoRotateCommand(platform, appExecutablePath)
  installPostCommitHook(autoRotate)
  installGitLogCoAuthorsScript()

  initializeGitConfig()
}

function installConfigFile() {
  if (!fs.existsSync(GIT_COLLAB_PATH)) {
    fs.mkdirSync(GIT_COLLAB_PATH, 0o755)
  }

  if (!fs.existsSync(CONFIG_FILE)) {
    logger.info('Installing config file...')
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ users: [], repos: [] }), { encoding: 'utf-8', mode: 0o644 })
  }
}

async function checkForNewerVersion(appVersion) {
  const latestVersion = await getLatestVersion()

  if (latestVersion && latestVersion !== appVersion) {
    notificationService.showUpdateAvailable()
  }
}

function getAutoRotateCommand(platform, appExecutablePath) {
  if (path.basename(appExecutablePath).match(/electron/i)) {
    return `cd ${appExecutablePath.split('/node_modules')[0]}
  npm run start -- -- users rotate
  cd $(dirname $0)/../../`
  }

  let prepend = ''
  let postpend = ' > /dev/null 2>&1 &'
  if (platform === 'win32') {
    prepend = 'start '
    postpend = ''
  }

  return `${prepend}${appExecutablePath.replace(new RegExp(/\\/, 'g'), '\\\\')} users rotate${postpend}`
}

function installPostCommitHook(autoRotate) {
  const postCommitScript = `#!/bin/sh

body=$(git log -1 HEAD --format="%b")
author=$(git log -1 HEAD --format="%an <%ae>")
co_authors_string=$(git config --global git-collab.co-authors)
co_authors=$(echo $co_authors_string | tr ";" "\n")

echo -e "git-collab > Author:\\n  $author"

if [[ "$body" != *$co_authors ]]; then
  subject=$(git log -1 HEAD --format="%s")

  echo -e "git-collab > Co-Author(s):\\n\${co_authors//Co-Authored-By:/ }"
  echo ""

  if [[ "$body" == Co-Authored-By* ]]; then
    body=$co_authors
  else
    body=\${body//Co-Authored-By*/}
    body="$body\n\n$co_authors"
  fi

  git commit --amend --no-verify --message="$subject\n\n$body"

  echo ""
  echo "git-collab > Rotating author and co-author(s)"
  ${autoRotate}
fi
`

  const isPostCommitCurrent = fs.existsSync(POST_COMMIT_FILE) &&
    fs.readFileSync(POST_COMMIT_FILE, 'utf-8') === postCommitScript
  if (!isPostCommitCurrent) {
    logger.info('Installing post-commit hook')
    fs.writeFileSync(POST_COMMIT_FILE, postCommitScript, { encoding: 'utf-8', mode: 0o755 })
  }

  const repos = repoService.get()
  for (const repo of repos) {
    gitService.initRepo(repo.path)
  }
}

function installGitLogCoAuthorsScript() {
  const gitLogCoAuthorScript = `#!/bin/bash

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

  const isGitLogCoAuthorCurrent = fs.existsSync(GIT_LOG_CO_AUTHOR_FILE) &&
    fs.readFileSync(GIT_LOG_CO_AUTHOR_FILE, 'utf-8') === gitLogCoAuthorScript
  if (!isGitLogCoAuthorCurrent) {
    logger.info('Installing git log co-author script')
    fs.writeFileSync(GIT_LOG_CO_AUTHOR_FILE, gitLogCoAuthorScript, { encoding: 'utf-8', mode: 0o755 })
  }

  gitService.setGitLogAlias(GIT_LOG_CO_AUTHOR_FILE)
}

function initializeGitConfig() {
  const users = userService.get()
  gitService.updateAuthorAndCoAuthors(users)
}

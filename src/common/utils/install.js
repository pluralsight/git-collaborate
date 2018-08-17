import fs from 'fs'
import os from 'os'
import path from 'path'

import * as gitService from '../services/git'
import * as repoService from '../services/repo'
import * as userService from '../services/user'

export const GIT_SWITCH_PATH = path.join(os.homedir(), '.git-switch')
export const CONFIG_FILE = path.join(GIT_SWITCH_PATH, 'config.json')
export const POST_COMMIT_FILE = path.join(GIT_SWITCH_PATH, 'post-commit')
export const GIT_LOG_CO_AUTHOR_FILE = path.join(GIT_SWITCH_PATH, 'git-log-co-author')

export default async function(platform, appExecutablePath) {
  installConfigFile()

  const autoRotate = getAutoRotateCommand(platform, appExecutablePath)
  await installPostCommitHook(autoRotate)
  installGitLogCoAuthorsScript()

  initializeGitConfig()
}

function installConfigFile() {
  if (!fs.existsSync(GIT_SWITCH_PATH))
    fs.mkdirSync(GIT_SWITCH_PATH)

  if (!fs.existsSync(CONFIG_FILE)) {
    console.log('Installing config file...')
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ users: [], repos: [] }), 'utf-8')
  }
}

function getAutoRotateCommand(platform, appExecutablePath) {
  if (path.basename(appExecutablePath).match(/electron/i)) {
    return `cd ${appExecutablePath.split('/node_modules')[0]}
  npm run start --- -- rotate
  cd $(dirname $0)/../../`
  }

  let prepend = ''
  let postpend = ' > /dev/null 2>&1 &'
  if (platform === 'win32') {
    prepend = 'start '
    postpend = ''
  }

  return `${prepend}${appExecutablePath.replace(new RegExp(/\\/, 'g'), '\\\\')} rotate${postpend}`
}

async function installPostCommitHook(autoRotate) {
  const postCommitScript = `#!/bin/sh

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

  const isPostCommitCurrent = fs.existsSync(POST_COMMIT_FILE) &&
    fs.readFileSync(POST_COMMIT_FILE, 'utf-8') === postCommitScript
  if (!isPostCommitCurrent) {
    console.log('Installing post-commit hook')
    fs.writeFileSync(POST_COMMIT_FILE, postCommitScript, { encoding: 'utf-8', mode: 0o755 })
  }

  const repos = repoService.get()
  for (const repo of repos) {
    console.log(`Writing post-commit hook to repo "${repo.path}"`)
    await repoService.add(repo.path)
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
  git log --pretty=format:"commitHash %h$us(%ar)$us%d$us%s$us<%an>$us%b" |
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
    console.log('Installing git log co-author script')
    fs.writeFileSync(GIT_LOG_CO_AUTHOR_FILE, gitLogCoAuthorScript, { encoding: 'utf-8', mode: 0o755 })
    gitService.setGitLogAlias(GIT_LOG_CO_AUTHOR_FILE)
  }
}

function initializeGitConfig() {
  const users = userService.get()
  gitService.updateAuthorAndCoAuthors(users)
}

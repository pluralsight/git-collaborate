import fs from 'fs'
import os from 'os'
import path from 'path'

import { getLatestVersion, logger } from '.'
import { gitService, notificationService, repoService, userService } from '../services'

export const GIT_COLLAB_PATH = path.join(os.homedir(), '.git-collab')
export const CONFIG_FILE = path.join(GIT_COLLAB_PATH, 'config.json')
export const GIT_SWITCH_CONFIG_FILE = path.join(os.homedir(), '.git-switch', 'config.json')
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
    if (fs.existsSync(GIT_SWITCH_CONFIG_FILE)) {
      const oldConfig = fs.readFileSync(GIT_SWITCH_CONFIG_FILE, 'utf-8')
      fs.writeFileSync(CONFIG_FILE, oldConfig, { encoding: 'utf-8', mode: 0o644 })
    } else {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify({ users: [], repos: [] }), { encoding: 'utf-8', mode: 0o644 })
    }
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

export function getPostCommitHookScript(autoRotate) {
  return `#!/bin/sh

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
}

function installPostCommitHook(autoRotate) {
  const postCommitScript = getPostCommitHookScript(autoRotate)

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

export function getGitLogCoAuthorScript() {
  return `#!/bin/bash

# Pretty formatting for git logs with github's co-author support.

this_ifs=$'\\037'
begin_commit="---begin_commit---"
begin_commit_regex="^($begin_commit)(.*)"
co_author_regex="([Cc]o-[Aa]uthored-[Bb]y: )(.*)( <.*)"

red="\\e[01;31m"
green="\\e[01;32m"
yellow="\\e[33m"
blue="\\e[01;34m"
magenta="\\e[01;35m"
cyan="\\e[01;36m"
white="\\e[37m"

commit_hash=""
date=""
branches=()
summary=""
author=""
co_authors=()

function join_by {
  local delim=$1
  shift
  echo -n "$1"
  shift
  printf "%s" "\${@/#/$delim}"
}

function print_branches {
  if [ "\${#branches[@]}" != 0 ]; then
    formatted_branches=()

    for ref in "\${branches[@]}"; do
      case "$ref" in
        HEAD*)
          formatted_branches+=("$cyan$ref$magenta")
          ;;
        tag*)
          formatted_branches+=("$red$ref$magenta")
          ;;
        *)
          formatted_branches+=($ref)
          ;;
      esac
    done

    echo "$magenta($(join_by ", " \${formatted_branches[@]}))$white "
  fi
}

function print_co_authors {
  [ \${#co_authors[@]} -ne 0 ] && echo " $blue($(join_by ", " \${co_authors[@]}))$white" || echo ""
}

function print_commit {
  echo -e "$cyan$commit_hash $yellow($date)$white - $(print_branches)$summary $green<$author>$(print_co_authors)"
}

function parse_commit_hash() {
  commit_hash=$(echo -e "$1" | sed -e "s/$begin_commit\\(.*\\)/\\1/")
}

function parse_branches() {
  trimmed=$(echo -e "$1" | sed -e "s/,[[:space:]]\\+/,/g")

  local IFS=","
  read -a branches <<< $trimmed
}

function parse_co_author {
  if [[ $1 =~ $co_author_regex ]]; then
    author_name=\${BASH_REMATCH[2]}
    [[ ! "\${co_authors[@]}" =~ "$author_name" ]] && co_authors+=($author_name)
  fi
}

function parse_line {
  branches=()
  co_authors=()
  data=($@)

  parse_commit_hash \${data[0]}
  date=\${data[1]}
  parse_branches \${data[2]}
  summary=\${data[3]}
  author=\${data[4]}
  parse_co_author \${data[5]}
}

function parse_git_log {
  local IFS=$this_ifs

  while read line; do
    if [[ $line =~ $begin_commit_regex ]]; then
      if [ -n "$commit_hash" ]; then
        print_commit
      fi

      parse_line $line
    else
      parse_co_author $line
    fi
  done

  print_commit
}

function main {
  git log --pretty=format:"$begin_commit%h$this_ifs%as, %ar$this_ifs%D$this_ifs%s$this_ifs%an$this_ifs%b%n" |
    sed "/^[[:blank:]]*$/d" |
    parse_git_log |
    less -RFX
}

main
`
}

function installGitLogCoAuthorsScript() {
  const gitLogCoAuthorScript = getGitLogCoAuthorScript()

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

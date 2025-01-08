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
    fs.mkdirSync(GIT_COLLAB_PATH, { mode: 0o755 })
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
  return `#!/usr/bin/env sh

readonly co_authors=$(git config --global git-collab.co-authors | tr ';' '\\n')
[ -z "$co_authors" ] && exit 0

readonly subject=$(git log -1 --format="%s")
readonly body=$(git log -1 --format="%b")
readonly author=$(git log -1 --format="%an <%ae>")

match_co_authors() {
  _co_author_lines=$(printf "%s\\n" "$2" | wc -l)
  _body_end=$(printf "%s" "$1" | tail -n "$_co_author_lines")

  [ "$_body_end" = "$2" ]
}

match_co_authors "$body" "$co_authors" && exit 0

printf "git-collab > Author:\\n  %s\\n" "$author"
printf "git-collab > Co-Author(s):\\n%s\\n\\n" "$(printf "%s" "$co_authors" | sed 's/^Co-Authored-By: /  /g')"

case "$body" in
  ""|"Co-Authored-By:"*)
    new_body=$co_authors
    ;;
  *)
    new_body=\${body%%Co-Authored-By*}
    new_body=$(printf "%s\\n\\n%s" "$new_body" "$co_authors")
    ;;
esac

message="$(printf "%s\\n\\n%s" "$subject" "$new_body")"

git commit --quiet --amend --no-verify --message="$message"

printf "git-collab > Rotating author and co-author(s)\\n\\n"
${autoRotate}
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
    const { hooksPath, isValid } = gitService.initRepo(repo.path)
    if (isValid !== repo.isValid || hooksPath !== repo.hooksPath) {
      repo.hooksPath = hooksPath
      repo.isValid = isValid
    }
  }

  repoService.update(repos)
}

export function getGitLogCoAuthorScript() {
  return `#!/usr/bin/env sh

# Pretty formatting for git logs with github's co-author support

readonly line_ifs=$(printf '\\037')
readonly branch_ifs="|"
readonly begin_commit="### begin_commit ###"

commit_hash=""
date=""
branches=""
subject=""
author=""
co_authors=""

init_colors() {
  red=$(printf '\\033[31m')
  green=$(printf '\\033[32m')
  yellow=$(printf '\\033[33m')
  blue=$(printf '\\033[34m')
  magenta=$(printf '\\033[35m')
  cyan=$(printf '\\033[36m')
  white=$(printf '\\033[37m')
  reset=$(printf '\\033[0m')
}

print_branches() {
  [ -z "$branches" ] && return
  formatted_branches=""

  reset_ifs=$IFS
  IFS=$branch_ifs
  for ref in $branches; do
    [ -n "$formatted_branches" ] && formatted_branches="$formatted_branches, "

    # Remove leading spaces
    ref=\${ref#"\${ref%%[! ]*}"}

    case "$ref" in
      HEAD*) formatted_branches="$formatted_branches$cyan$ref$magenta";;
      tag*) formatted_branches="$formatted_branches$red$ref$magenta";;
      *) formatted_branches="$formatted_branches$ref";;
    esac
  done
  IFS=$reset_ifs

  printf "%s" "$magenta($formatted_branches)$reset"
}

print_co_authors() {
  [ -n "$co_authors" ] && printf "%s" "$blue($co_authors)$reset"
}

print_commit() {
  printf "%s %s - %s %s %s%s\\n" \\
    "$cyan$commit_hash$reset" \\
    "$yellow($date)$reset" \\
    "$(print_branches)" \\
    "$white$subject$reset" \\
    "$green<$author>$reset" \\
    "$(print_co_authors)"
}

parse_co_author() {
  case "$1" in
    *[Cc]o-[Aa]uthored-[Bb]y:*)
      # Remove 'Co-Authored-By: ' / 'Co-authored-by: ' prefix
      author_name=\${1#*[Bb]y: }
      author_name=\${author_name%% <*}
      [ -z "$co_authors" ] && co_authors=$author_name || co_authors="$co_authors, $author_name"
      ;;
  esac
}

parse_line() {
  line=$1

  reset_ifs=$IFS
  IFS=$line_ifs
  set -- $line
  IFS=$reset_ifs

  commit_hash=\${1#$begin_commit} # Remove the '### begin_commit ###' prefix
  date="$2"
  branches=$(printf "%s" "$3" | tr ',' "$branch_ifs")
  subject="$4"
  author="$5"
  [ -n "$6" ] && parse_co_author "$6"
}

parse_git_log() {
  while read -r line; do
    case "$line" in
      "$begin_commit"*)
        if [ -n "$commit_hash" ]; then
          print_commit
          commit_hash=""
          co_authors=""
        fi

        parse_line "$line"
        ;;
      *)
        parse_co_author "$line"
        ;;
    esac
  done

  print_commit # Print the last commit
}

init_colors

git log \\
  --no-notes \\
  --no-decorate \\
  --pretty=format:"$begin_commit%h\${line_ifs}%as, %ar\${line_ifs}%D\${line_ifs}%s\${line_ifs}%an\${line_ifs}%b%n" |
  parse_git_log |
  less -RFX
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

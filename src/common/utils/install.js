import fs from 'fs'
import os from 'os'
import path from 'path'

import * as gitService from '../services/git'
import * as repoService from '../services/repo'
import * as userService from '../services/user'

export const GIT_SWITCH_PATH = path.join(os.homedir(), '.git-switch')
export const CONFIG_FILE = path.join(GIT_SWITCH_PATH, 'config.json')
export const POST_COMMIT_FILE = path.join(GIT_SWITCH_PATH, 'post-commit')

export default function(platform, appExecutablePath) {
  installConfigFile()

  const autoRotate = getAutoRotateCommand(platform, appExecutablePath)
  installPostCommitHook(autoRotate)

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

function installPostCommitHook(autoRotate) {
  const postCommitScript = `#!/bin/sh

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

  const isPostCommitCurrent = fs.existsSync(POST_COMMIT_FILE) &&
    fs.readFileSync(POST_COMMIT_FILE, 'utf-8') === postCommitScript
  if (!isPostCommitCurrent) {
    console.log('Installing post-commit hook')
    fs.writeFileSync(POST_COMMIT_FILE, postCommitScript, 'utf-8')
  }

  const repos = repoService.get()
  for (const repo of repos) {
    console.log(`Writing post-commit hook to repo "${repo.path}"`)
    repoService.add(repo.path)
  }
}

function initializeGitConfig() {
  const users = userService.get()
  gitService.updateAuthorAndCoAuthors(users)
}

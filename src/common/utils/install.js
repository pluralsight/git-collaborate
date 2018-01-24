import fs from 'fs'
import os from 'os'
import path from 'path'

import * as repoService from '../services/repo'

export const GIT_SWITCH_PATH = path.join(os.homedir(), '.git-switch')
export const CONFIG_FILE = path.join(GIT_SWITCH_PATH, 'config.json')
export const POST_COMMIT_FILE = path.join(GIT_SWITCH_PATH, 'post-commit')

export default function(platform, appExecutablePath, isDev) {
  installConfigFile()

  const autoRotate = getAutoRotateCommand(platform, appExecutablePath, isDev)
  installPostCommitHook(autoRotate)
}

function installConfigFile() {
  if (!fs.existsSync(GIT_SWITCH_PATH))
    fs.mkdirSync(GIT_SWITCH_PATH)

  if (!fs.existsSync(CONFIG_FILE)) {
    console.log('Installing config file...')
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ users: [], repos: [] }), 'utf-8')
  }
}

function getAutoRotateCommand(platform, appExecutablePath, isDev) {
  if (isDev) {
    return 'echo "git-switch > Auto-rotate is disabled when running from npm"'
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

  const alreadyInstalled = fs.existsSync(POST_COMMIT_FILE) &&
    fs.readFileSync(POST_COMMIT_FILE, 'utf-8') === postCommitScript

  if (alreadyInstalled) return

  console.log('Installing post-commit hook')
  fs.writeFileSync(POST_COMMIT_FILE, postCommitScript, 'utf-8')

  const repos = repoService.get()
  for (const repo of repos) {
    console.log(`Writing post-commit hook to repo "${repo.path}"`)
    repoService.add(repo.path)
  }
}

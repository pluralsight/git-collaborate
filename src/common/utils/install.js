import fs from 'fs'
import os from 'os'
import path from 'path'

import * as repoService from '../services/repo'
import * as gitService from '../services/git'

export const GIT_SWITCH_PATH = path.join(os.homedir(), '.git-switch')
export const CONFIG_FILE = path.join(GIT_SWITCH_PATH, 'config.json')
export const POST_COMMIT_FILE = path.join(GIT_SWITCH_PATH, 'post-commit')
export const POST_COMMIT_GIT_SWITCH = `#!/bin/sh

actual_author=$(git log -1 HEAD --format="%an")
expected_author=$(git config --get author.name)
expected_author_email=$(git config --get author.email)

if [ "$actual_author" != "$expected_author" ]; then
  echo -e "git-switch > Amending commit with author\\n"
  git commit --amend --no-verify --no-edit --author="$expected_author <$expected_author_email>"
  open -g "git-switch://rotate" >&/dev/null 2>&1 &
fi
`

export default function() {
  if (!fs.existsSync(GIT_SWITCH_PATH))
    fs.mkdirSync(GIT_SWITCH_PATH)

  if (!fs.existsSync(CONFIG_FILE))
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ users: [], repos: [] }), 'utf-8')

  installPostCommitHook()
}

function installPostCommitHook() {
  const alreadyInstalled = fs.existsSync(POST_COMMIT_FILE) &&
    fs.readFileSync(POST_COMMIT_FILE, 'utf-8') === POST_COMMIT_GIT_SWITCH

  if (alreadyInstalled) return

  fs.writeFileSync(POST_COMMIT_FILE, POST_COMMIT_GIT_SWITCH, 'utf-8')

  const repos = repoService.get()
  for (const repo of repos) {
    gitService.initRepo(repo.path)
  }
}

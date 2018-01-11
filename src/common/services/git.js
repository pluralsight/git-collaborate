import fs from 'fs'
import os from 'os'
import path from 'path'

import execute from '../utils/exec'

export const GIT_SWITCH_PATH = path.join(os.homedir(), '.git-switch')
export const POST_COMMIT_BASE = '#!/bin/bash\n\n/bin/bash "$(dirname $0)"/post-commit.git-switch'

const defaultAuthorAndCommitter = {
  author: { name: '', email: '' },
  committer: { name: '', email: '' }
}

export async function setAuthor(name, email) {
  await execute(`git config --global author.name "${name}"`)
  await execute(`git config --global author.email "${email}"`)
}

export async function setCommitter(name, email) {
  await execute(`git config --global user.name "${name}"`)
  await execute(`git config --global user.email "${email}"`)
}

export async function updateAuthorAndCommitter(users) {
  const activeUsers = users.filter(u => u.active)
  if (!activeUsers.length)
    return defaultAuthorAndCommitter

  const author = activeUsers.length === 1
    ? activeUsers[0]
    : activeUsers.shift()

  const committer = {
    name: activeUsers.map(u => u.name).join(' & '),
    email: activeUsers.map(u => u.email).join(', ')
  }

  await this.setAuthor(author.name, author.email)
  await this.setCommitter(committer.name, committer.email)
}

function makeFileExecutable(destination) {
  // get current permissions in octal form (i.e. 755, 644)
  const fileMode = fs.statSync(destination).mode
  const filePermissions = (fileMode & parseInt('777', 8)).toString(8)

  let newPermissions = '0'
  for (let char of filePermissions) {
    newPermissions += parseInt(char) % 2 === 0
      ? (parseInt(char) + 1).toString()
      : char
  }

  fs.chmodSync(destination, newPermissions)
}

function copyGitSwitchPostCommit(gitHooksPath) {
  const source = path.join(GIT_SWITCH_PATH, 'post-commit')
  const destination = path.join(gitHooksPath, 'post-commit.git-switch')

  const readPostCommit = fs.createReadStream(source, 'utf-8')
  const writePostCommit = fs.createWriteStream(destination, 'utf-8')

  readPostCommit.pipe(writePostCommit)
  makeFileExecutable(destination)
}

function mergePostCommitScripts(postCommitFile) {
  let postCommitScript = fs.readFileSync(postCommitFile, 'utf-8')
  if (!postCommitScript.includes(POST_COMMIT_BASE)) {
    const temp = postCommitScript.substring(postCommitScript.indexOf('\n'))
    postCommitScript = POST_COMMIT_BASE.concat(temp)
  }

  return postCommitScript
}

function writePostCommit(gitHooksPath) {
  const postCommitFile = path.join(gitHooksPath, 'post-commit')
  const postCommitScript = fs.existsSync(postCommitFile)
    ? mergePostCommitScripts(postCommitFile)
    : POST_COMMIT_BASE

  fs.writeFileSync(postCommitFile, postCommitScript, 'utf-8')
  makeFileExecutable(postCommitFile)
}

export function initRepo(repoPath) {
  if (!fs.existsSync(repoPath))
    throw new Error('The specified path does not exist')
  if (!fs.existsSync(path.join(repoPath, '.git')))
    throw new Error('The specified path does not contain a ".git" directory')

  const gitHooksPath = path.join(repoPath, '.git', 'hooks')
  copyGitSwitchPostCommit(gitHooksPath)
  writePostCommit(gitHooksPath)
}

function removeGitSwitchPostCommitScript(gitHooksPath) {
  const postCommitGitSwitchFile = path.join(gitHooksPath, 'post-commit.git-switch')
  if (fs.existsSync(postCommitGitSwitchFile)) {
    fs.unlinkSync(postCommitGitSwitchFile)
  }
}

function removePostCommitScript(gitHooksPath) {
  const postCommitFile = path.join(gitHooksPath, 'post-commit')
  if (fs.existsSync(postCommitFile)) {
    let postCommitScript = fs.readFileSync(postCommitFile, 'utf-8')
    if (postCommitScript === POST_COMMIT_BASE) {
      fs.unlinkSync(postCommitFile)
    } else {
      postCommitScript = postCommitScript.replace(POST_COMMIT_BASE, '#!/bin/bash')
      fs.writeFileSync(postCommitFile, postCommitScript, 'utf-8')
    }
  }
}

export function removeRepo(repoPath) {
  const gitHooksPath = path.join(repoPath, '.git', 'hooks')
  removeGitSwitchPostCommitScript(gitHooksPath)
  removePostCommitScript(gitHooksPath)
}

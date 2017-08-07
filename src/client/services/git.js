import fs from 'fs'
import path from 'path'

import execute from '../../utils/exec'

const POST_COMMIT_GIT_SWITCH = '#!/bin/bash\n\n/bin/bash "$(dirname $0)"/post-commit.git-switch'
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

export function getAuthorAndCommitter(users) {
  const activeUsers = users.filter(u => u.active)
  if (!activeUsers.length)
    return defaultAuthorAndCommitter

  const author = activeUsers.length === 1
    ? activeUsers[0]
    : activeUsers.shift()

  return {
    author: {
      name: author.name,
      email: author.email
    },
    committer: {
      name: activeUsers.map(u => u.name).join(' & '),
      email: activeUsers.map(u => u.email).join(', ')
    }
  }
}

function copyGitSwitchPostCommit(gitHooksPath) {
  const source = path.join(process.cwd(), 'scripts', 'post-commit')
  const destination = path.join(gitHooksPath, 'post-commit.git-switch')

  const readPostCommit = fs.createReadStream(source, 'utf-8')
  const writePostCommit = fs.createWriteStream(destination, 'utf-8')

  readPostCommit.pipe(writePostCommit)
}

function mergePostCommitScripts(postCommitFile) {
  let postCommitScript = fs.readFileSync(postCommitFile, 'utf-8')
  if (!postCommitScript.includes(POST_COMMIT_GIT_SWITCH)) {
    const temp = postCommitScript.substring(postCommitScript.indexOf('\n'))
    postCommitScript = POST_COMMIT_GIT_SWITCH.concat(temp)
  }

  return postCommitScript
}

function writePostCommit(gitHooksPath) {
  const postCommitFile = path.join(gitHooksPath, 'post-commit')
  const postCommitScript = fs.existsSync(postCommitFile)
    ? mergePostCommitScripts(postCommitFile)
    : POST_COMMIT_GIT_SWITCH

  fs.writeFileSync(postCommitFile, postCommitScript, 'utf-8')
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
    if (postCommitScript === POST_COMMIT_GIT_SWITCH) {
      fs.unlinkSync(postCommitFile)
    } else {
      postCommitScript = postCommitScript.replace(POST_COMMIT_GIT_SWITCH, '#!/bin/bash')
      fs.writeFileSync(postCommitFile, postCommitScript, 'utf-8')
    }
  }
}

export function removeRepo(repoPath) {
  const gitHooksPath = path.join(repoPath, '.git', 'hooks')
  removeGitSwitchPostCommitScript(gitHooksPath)
  removePostCommitScript(gitHooksPath)
}

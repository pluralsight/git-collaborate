import fs from 'fs'
import path from 'path'

import execute from '../../utils/exec'

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

function mergePostCommitScripts(postCommitFile, postCommitGitSwitch) {
  let postCommitScript = fs.readFileSync(postCommitFile, 'utf-8')
  if (!postCommitScript.includes(postCommitGitSwitch)) {
    const temp = postCommitScript.substring(postCommitScript.indexOf('\n'))
    postCommitScript = postCommitGitSwitch.concat(temp)
  }

  return postCommitScript
}

function writePostCommit(gitHooksPath) {
  const postCommitGitSwitch = '#!/bin/bash\n\n/bin/bash "$(dirname $0)"/post-commit.git-switch'

  const postCommitFile = path.join(gitHooksPath, 'post-commit')
  const postCommitScript = fs.existsSync(postCommitFile)
    ? mergePostCommitScripts(postCommitFile, postCommitGitSwitch)
    : postCommitGitSwitch

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

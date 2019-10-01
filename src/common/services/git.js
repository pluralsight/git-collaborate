import fs from 'fs'
import os from 'os'
import path from 'path'

import { execute } from '../utils/exec'
import * as logger from '../utils/logger'

export const GIT_SWITCH_PATH = path.join(os.homedir(), '.git-switch')
export const POST_COMMIT_BASE = '#!/bin/bash\n\n/bin/bash "$(dirname $0)"/post-commit.git-switch'

export function setAuthor(name, email) {
  execute(`git config --global user.name "${name}"`)
  execute(`git config --global user.email "${email}"`)
}

export function setCoAuthors(coAuthors) {
  const value = coAuthors
    .map(ca => `Co-Authored-By: ${ca.name} <${ca.email}>`)
    .join(';')

  execute(`git config --global git-switch.co-authors "${value}"`)
}

export function updateAuthorAndCoAuthors(users) {
  const activeUsers = users.filter(u => u.active)
  if (!activeUsers.length)
    return

  const author = activeUsers.shift()
  this.setAuthor(author.name, author.email)

  this.setCoAuthors(activeUsers)
}

export function setGitLogAlias(scriptPath) {
  execute(`git config --global alias.lg "!${scriptPath.replace(/\\/g, '/')}"`)
}

function copyGitSwitchPostCommit(gitHooksPath) {
  const source = path.join(GIT_SWITCH_PATH, 'post-commit')
  const destination = path.join(gitHooksPath, 'post-commit.git-switch')

  const readPostCommit = fs.createReadStream(source, 'utf-8')
  const writePostCommit = fs.createWriteStream(destination, { encoding: 'utf-8', mode: 0o755 })

  readPostCommit.pipe(writePostCommit)
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

  fs.writeFileSync(postCommitFile, postCommitScript, { encoding: 'utf-8', mode: 0o755 })
}

function addPostCommitFiles(destination) {
  copyGitSwitchPostCommit(destination)
  writePostCommit(destination)
}

function getSubmodulesForRepo(repoPath) {
  const submodulesStatus = execute('git submodule status', { cwd: repoPath })
  const statuses = (submodulesStatus && submodulesStatus.trim().split('\n')) || []

  return statuses.map(s => s.trim().split(' ')[1])
}

function addPostCommitFilesToSubModules(repoPath) {
  const submodulesPath = path.join(repoPath, '.git', 'modules')

  if (fs.existsSync(submodulesPath)) {
    const submodules = getSubmodulesForRepo(repoPath)

    submodules.forEach(modulePath => {
      const hooksPath = path.join(submodulesPath, ...modulePath.split('/'), 'hooks')
      addPostCommitFiles(hooksPath)
    })
  }
}

export function initRepo(repoPath) {
  if (!fs.existsSync(repoPath))
    throw new Error('The specified path does not exist')
  if (!fs.existsSync(path.join(repoPath, '.git')))
    throw new Error('The specified path does not contain a ".git" directory')

  logger.info(`Writing post-commit hook to repo "${repoPath}"`)

  addPostCommitFiles(path.join(repoPath, '.git', 'hooks'))
  addPostCommitFilesToSubModules(repoPath)
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
      fs.writeFileSync(postCommitFile, postCommitScript, { encoding: 'utf-8', mode: 0o755 })
    }
  }
}

function removePostCommitFiles(target) {
  removeGitSwitchPostCommitScript(target)
  removePostCommitScript(target)
}

function removePostCommitFilesFromSubModules(target) {
  if (fs.existsSync(target)) {
    for (const submoduleDir of fs.readdirSync(target)) {
      removePostCommitFiles(path.join(target, submoduleDir, 'hooks'))
    }
  }
}

export function removeRepo(repoPath) {
  removePostCommitFiles(path.join(repoPath, '.git', 'hooks'))
  removePostCommitFilesFromSubModules(path.join(repoPath, '.git', 'modules'))
}

import fs from 'fs'
import os from 'os'
import path from 'path'

import execute from '../utils/exec'

export const GIT_SWITCH_PATH = path.join(os.homedir(), '.git-switch')
export const POST_COMMIT_BASE = '#!/bin/bash\n\n/bin/bash "$(dirname $0)"/post-commit.git-switch'

export async function setAuthor(name, email) {
  await execute(`git config --global user.name "${name}"`)
  await execute(`git config --global user.email "${email}"`)
}

export async function setCoAuthors(coAuthors) {
  const value = coAuthors
    .map(ca => `Co-Authored-By: ${ca.name} <${ca.email}>`)
    .join(';')

  await execute(`git config --global git-switch.co-authors "${value}"`)
}

export async function updateAuthorAndCoAuthors(users) {
  const activeUsers = users.filter(u => u.active)
  if (!activeUsers.length)
    return

  const author = activeUsers.shift()
  await this.setAuthor(author.name, author.email)

  await this.setCoAuthors(activeUsers)
}

function makeFileExecutable(destination) {
  // get current permissions in octal form (i.e. 755, 644)
  const file = fs.statSync(destination)
  const filePermissions = (file.mode & parseInt('777', 8)).toString(8)

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

function addPostCommitFiles(destination) {
  copyGitSwitchPostCommit(destination)
  writePostCommit(destination)
}

function addPostCommitFilesToSubModules(destination) {
  if (fs.existsSync(destination)) {
    for (let submoduleDir of fs.readdirSync(destination)) {
      const submodulePath = path.join(destination, submoduleDir)
      const dir = fs.statSync(submodulePath)

      if (dir.isDirectory())
        addPostCommitFiles(path.join(submodulePath, 'hooks'))
    }
  }
}

export function initRepo(repoPath) {
  if (!fs.existsSync(repoPath))
    throw new Error('The specified path does not exist')
  if (!fs.existsSync(path.join(repoPath, '.git')))
    throw new Error('The specified path does not contain a ".git" directory')

  addPostCommitFiles(path.join(repoPath, '.git', 'hooks'))
  addPostCommitFilesToSubModules(path.join(repoPath, '.git', 'modules'))
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

function removePostCommitFiles(target) {
  removeGitSwitchPostCommitScript(target)
  removePostCommitScript(target)
}

function removePostCommitFilesFromSubModules(target) {
  if (fs.existsSync(target)) {
    for (let submoduleDir of fs.readdirSync(target)) {
      removePostCommitFiles(path.join(target, submoduleDir, 'hooks'))
    }
  }
}

export function removeRepo(repoPath) {
  removePostCommitFiles(path.join(repoPath, '.git', 'hooks'))
  removePostCommitFilesFromSubModules(path.join(repoPath, '.git', 'modules'))
}

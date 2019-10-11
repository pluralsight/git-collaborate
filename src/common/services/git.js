import fs from 'fs'
import os from 'os'
import path from 'path'

import { execute } from '../utils/exec'
import * as logger from '../utils/logger'

export const GIT_SWITCH_PATH = path.join(os.homedir(), '.git-switch')
export const POST_COMMIT_BASE = '#!/bin/bash\n\n/bin/bash "$(dirname $0)"/post-commit.git-switch'

export const setAuthor = (name, email) => {
  execute(`git config --global user.name "${name}"`)
  execute(`git config --global user.email "${email}"`)
}

export const setCoAuthors = coAuthors => {
  const value = coAuthors
    .map(ca => `Co-Authored-By: ${ca.name} <${ca.email}>`)
    .join(';')

  execute(`git config --global git-switch.co-authors "${value}"`)
}

export const updateAuthorAndCoAuthors = users => {
  const activeUsers = users.filter(u => u.active)
  if (!activeUsers.length)
    return

  const author = activeUsers.shift()
  setAuthor(author.name, author.email)

  setCoAuthors(activeUsers)
}

export const setGitLogAlias = scriptPath => {
  execute(`git config --global alias.lg "!${scriptPath.replace(/\\/g, '/')}"`)
}

const copyGitSwitchPostCommit = gitHooksPath => {
  const source = path.join(GIT_SWITCH_PATH, 'post-commit')
  const destination = path.join(gitHooksPath, 'post-commit.git-switch')

  const postCommitContents = fs.readFileSync(source, 'utf-8')
  fs.writeFileSync(destination, postCommitContents, { encoding: 'utf-8', mode: 0o755 })
}

const mergePostCommitScripts = postCommitFile => {
  let postCommitScript = fs.readFileSync(postCommitFile, 'utf-8')
  if (!postCommitScript.includes(POST_COMMIT_BASE)) {
    const temp = postCommitScript.substring(postCommitScript.indexOf('\n'))
    postCommitScript = POST_COMMIT_BASE.concat(temp)
  }

  return postCommitScript
}

const writePostCommit = gitHooksPath => {
  const postCommitFile = path.join(gitHooksPath, 'post-commit')
  const postCommitScript = fs.existsSync(postCommitFile)
    ? mergePostCommitScripts(postCommitFile)
    : POST_COMMIT_BASE

  fs.writeFileSync(postCommitFile, postCommitScript, { encoding: 'utf-8', mode: 0o755 })
}

const addPostCommitFiles = destination => {
  copyGitSwitchPostCommit(destination)
  writePostCommit(destination)
}

const getSubmodulesForRepo = (repoPath) => {
  const submodulesStatus = execute('git submodule status', { cwd: repoPath })
  const statuses = (submodulesStatus && submodulesStatus.trim().split('\n')) || []

  return statuses.map(s => s.trim().split(' ')[1])
}

const addPostCommitFilesToSubModules = repoPath => {
  const submodulesPath = path.join(repoPath, '.git', 'modules')

  if (fs.existsSync(submodulesPath)) {
    const submodules = getSubmodulesForRepo(repoPath)

    submodules.forEach(modulePath => {
      const hooksPath = path.join(submodulesPath, ...modulePath.split('/'), 'hooks')
      addPostCommitFiles(hooksPath)
    })
  }
}

export const initRepo = repoPath => {
  if (!fs.existsSync(repoPath))
    throw new Error('The specified path does not exist')
  if (!fs.existsSync(path.join(repoPath, '.git')))
    throw new Error('The specified path does not contain a ".git" directory')

  logger.info(`Writing post-commit hook to repo "${repoPath}"`)

  addPostCommitFiles(path.join(repoPath, '.git', 'hooks'))
  addPostCommitFilesToSubModules(repoPath)
}

const removeGitSwitchPostCommitScript = gitHooksPath => {
  const postCommitGitSwitchFile = path.join(gitHooksPath, 'post-commit.git-switch')
  if (fs.existsSync(postCommitGitSwitchFile)) {
    fs.unlinkSync(postCommitGitSwitchFile)
  }
}

const removePostCommitScript = gitHooksPath => {
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

const removePostCommitFiles = target => {
  removeGitSwitchPostCommitScript(target)
  removePostCommitScript(target)
}

const removePostCommitFilesFromSubModules = target => {
  if (fs.existsSync(target)) {
    for (const submoduleDir of fs.readdirSync(target)) {
      removePostCommitFiles(path.join(target, submoduleDir, 'hooks'))
    }
  }
}

export const removeRepo = repoPath => {
  removePostCommitFiles(path.join(repoPath, '.git', 'hooks'))
  removePostCommitFilesFromSubModules(path.join(repoPath, '.git', 'modules'))
}

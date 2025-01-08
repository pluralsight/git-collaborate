import fs from 'fs'
import os from 'os'
import path from 'path'

import { execute, logger } from '../utils'

export const GIT_COLLAB_PATH = path.join(os.homedir(), '.git-collab')
export const GIT_SWITCH_POST_COMMIT_BASE = '#!/bin/bash\n\n/bin/bash "$(dirname $0)"/post-commit.git-switch'
export const POST_COMMIT_BASE_OLD = '#!/bin/bash\n\n/bin/bash "$(dirname $0)"/post-commit.git-collab'
export const POST_COMMIT_BASE = '#!/usr/bin/env sh\n\n[ -f "$(dirname $0)/git-collab/post-commit" ] && . $(dirname $0)/git-collab/post-commit'

export const setAuthor = (name, email) => {
  execute(`git config --global user.name "${name}"`)
  execute(`git config --global user.email "${email}"`)
}

export const setCoAuthors = (coAuthors) => {
  const value = coAuthors
    .map((ca) => `Co-Authored-By: ${ca.name} <${ca.email}>`)
    .join(';')

  execute(`git config --global git-collab.co-authors "${value}"`)
}

export const updateAuthorAndCoAuthors = (users) => {
  const activeUsers = users.filter((u) => u.active)
  if (!activeUsers.length)
    return

  const author = activeUsers.shift()
  setAuthor(author.name, author.email)

  setCoAuthors(activeUsers)
}

export const setGitLogAlias = (scriptPath) => {
  execute(`git config --global alias.lg "!${scriptPath.replace(/\\/g, '/')}"`)
}

const copyGitCollabPostCommit = (gitHooksPath) => {
  const source = path.join(GIT_COLLAB_PATH, 'post-commit')
  const gitCollabDir = path.join(gitHooksPath, 'git-collab')

  fs.mkdirSync(gitCollabDir, { recursive: true })

  const destination = path.join(gitCollabDir, 'post-commit')
  const postCommitContents = fs.readFileSync(source, 'utf-8')
  fs.writeFileSync(destination, postCommitContents, { encoding: 'utf-8', mode: 0o755 })

  if (!gitHooksPath.match(/\.git\/hooks$/)) {
    fs.writeFileSync(path.join(gitHooksPath, 'git-collab', '.gitignore'), '*', { encoding: 'utf-8' })
  }
}

const mergePostCommitScripts = (postCommitFile, gitHooksPath) => {
  let postCommitScript = fs.readFileSync(postCommitFile, 'utf-8')
  if (postCommitScript.includes(GIT_SWITCH_POST_COMMIT_BASE)) {
    postCommitScript = postCommitScript.replace('git-switch', 'git-collab')
    fs.unlinkSync(path.join(gitHooksPath, 'post-commit.git-switch'))
  }
  if (postCommitScript.includes('post-commit.git-collab')) {
    fs.unlinkSync(path.join(gitHooksPath, 'post-commit.git-collab'))
  }

  if (postCommitScript.includes(POST_COMMIT_BASE_OLD)) {
    postCommitScript = postCommitScript.replace(POST_COMMIT_BASE_OLD, POST_COMMIT_BASE)
  }

  if (!postCommitScript.includes(POST_COMMIT_BASE)) {
    const temp = postCommitScript.substring(postCommitScript.indexOf('\n'))
    postCommitScript = POST_COMMIT_BASE.concat(temp)
  }

  return postCommitScript
}

const writePostCommit = (gitHooksPath) => {
  const postCommitFile = path.join(gitHooksPath, 'post-commit')
  const postCommitScript = fs.existsSync(postCommitFile)
    ? mergePostCommitScripts(postCommitFile, gitHooksPath)
    : POST_COMMIT_BASE

  fs.writeFileSync(postCommitFile, postCommitScript, { encoding: 'utf-8', mode: 0o755 })
}

const addPostCommitFiles = (destination) => {
  copyGitCollabPostCommit(destination)
  writePostCommit(destination)
}

const getSubmodulesForRepo = (repoPath) => {
  const submodulesStatus = execute('git submodule status', { cwd: repoPath })
  const statuses = submodulesStatus?.toString().trim().split('\n') ?? []

  return statuses.map((s) => s.trim().split(' ')[1])
}

const addPostCommitFilesToSubModules = (repoPath) => {
  const submodulesPath = path.join(repoPath, '.git', 'modules')

  if (fs.existsSync(submodulesPath)) {
    const submodules = getSubmodulesForRepo(repoPath)

    submodules.forEach((modulePath) => {
      const hooksPath = path.join(submodulesPath, ...modulePath.split('/'), 'hooks')
      addPostCommitFiles(hooksPath)
    })
  }
}

export const initRepo = (repoPath) => {
  if (!fs.existsSync(repoPath)) {
    logger.error('Path not found:', repoPath)
    return { isValid: false }
  }
  if (!fs.existsSync(path.join(repoPath, '.git'))) {
    logger.error('Path not a git repository:', repoPath)
    return { isValid: false }
  }

  logger.info('Writing post-commit hook to repository:', repoPath)

  let hooksPath = path.join(repoPath, '.git', 'hooks')
  try {
    const localHooksPath = execute('git config --local core.hooksPath', { cwd: repoPath })
    hooksPath = localHooksPath
      ? path.join(repoPath, localHooksPath.toString().trim())
      : hooksPath

    // Do not write to the managed husky directory
    if (hooksPath.match(/\.husky\/_$/)) {
      hooksPath = hooksPath.replace(/\.husky\/_$/, '.husky')
    }
  } catch (e) {
    // no-op
  }

  addPostCommitFiles(hooksPath)
  addPostCommitFilesToSubModules(repoPath)

  return { hooksPath, isValid: true }
}

const removeGitCollabPostCommitScript = (gitHooksPath) => {
  const postCommitGitCollabDir = path.join(gitHooksPath, 'git-collab')
  if (fs.existsSync(postCommitGitCollabDir)) {
    fs.rmdirSync(postCommitGitCollabDir, { recursive: true, force: true })
  }
  const oldPostCommitGitCollabFile = path.join(gitHooksPath, 'post-commit.git-collab')
  if (fs.existsSync(oldPostCommitGitCollabFile)) {
    fs.unlinkSync(oldPostCommitGitCollabFile)
  }
}

const removePostCommitScript = (gitHooksPath) => {
  const postCommitFile = path.join(gitHooksPath, 'post-commit')
  if (fs.existsSync(postCommitFile)) {
    let postCommitScript = fs.readFileSync(postCommitFile, 'utf-8')
    if (postCommitScript === POST_COMMIT_BASE || postCommitScript === POST_COMMIT_BASE_OLD) {
      fs.unlinkSync(postCommitFile)
    } else {
      postCommitScript = postCommitScript
        .replace(POST_COMMIT_BASE, '#!/usr/bin/env sh')
        .replace(POST_COMMIT_BASE, '#!/usr/bin/env sh')
      fs.writeFileSync(postCommitFile, postCommitScript, { encoding: 'utf-8', mode: 0o755 })
    }
  }
}

const removePostCommitFiles = (target) => {
  removePostCommitScript(target)
  removeGitCollabPostCommitScript(target)
}

const removePostCommitFilesFromSubModules = (target) => {
  if (fs.existsSync(target)) {
    for (const submoduleDir of fs.readdirSync(target)) {
      removePostCommitFiles(path.join(target, submoduleDir, 'hooks'))
    }
  }
}

export const removeRepo = (repoPath, hooksPath) => {
  removePostCommitFiles(hooksPath)
  removePostCommitFilesFromSubModules(path.join(repoPath, '.git', 'modules'))
}

import orderBy from 'lodash.orderby'

import * as config from '../utils/config'
import { initRepo, removeRepo } from './git'

export const get = () => {
  return config.read().repos || []
}

// find string after last '/' or '\'
const getNameFromPath = path => path.match(/(?:[^/\\](?![/\\]))+$/g)[0]
// remove trailing '/' or '\'
const normalizePath = path => path.replace(/[/\\]$/, '')

const persist = repos => {
  repos = orderBy(repos, r => r.name)
  config.write({ repos })

  return repos
}

export const add = path => {
  let repos = get()

  path = normalizePath(path)
  const name = getNameFromPath(path)

  const existingRepo = repos.find(r => r.path === path)
  if (existingRepo)
    repos = repos.filter(r => r !== existingRepo)

  let isValid = true
  try {
    initRepo(path)
  } catch (err) {
    isValid = false
  }

  return persist([
    ...repos,
    { name, path, isValid }
  ])
}

export const remove = path => {
  const repos = get()
  const foundIndex = repos.findIndex(r => r.path === path)
  if (foundIndex === -1) return repos

  if (repos[foundIndex].isValid) removeRepo(path)
  repos.splice(foundIndex, 1)

  return persist(repos)
}

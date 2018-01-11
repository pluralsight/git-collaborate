import orderBy from 'lodash/orderBy'

import * as config from '../utils/config'
import { initRepo, removeRepo } from './git'

export function get() {
  return config.read().repos || []
}

function getNameFromPath(path) {
  const lastSlashIndex = (path.lastIndexOf('/') || path.lastIndexOf('\\')) + 1
  return path.substring(lastSlashIndex)
}

function persist(repos) {
  repos = orderBy(repos, r => r.name)
  config.write({ repos })

  return repos
}

export function add(path) {
  let repos = get()
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

export function remove(path) {
  const repos = get()
  const foundIndex = repos.findIndex(r => r.path === path)
  if (foundIndex === -1) return repos

  if (repos[foundIndex].isValid) removeRepo(path)
  repos.splice(foundIndex, 1)

  return persist(repos)
}

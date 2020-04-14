import orderBy from 'lodash.orderby'

import { gitService } from './'
import { config } from '../utils'

export const get = () => {
  return config.read().repos || []
}

// find string after last '/' or '\'
const getNameFromPath = (path) => path.match(/(?:[^/\\](?![/\\]))+$/g)[0]
// remove trailing '/' or '\'
const normalizePath = (path) => path.replace(/[/\\]$/, '')

const persist = (repos) => {
  repos = orderBy(repos, (r) => r.name)
  config.write({ repos })

  return repos
}

export const add = (path) => {
  let repos = get()

  path = normalizePath(path)
  const name = getNameFromPath(path)

  const existingRepo = repos.find((r) => r.path === path)
  if (existingRepo) {
    repos = repos.filter((r) => r !== existingRepo)
  }

  const isValid = gitService.initRepo(path)

  return persist([
    ...repos,
    { name, path, isValid }
  ])
}

export const remove = (path) => {
  const repos = get()

  path = normalizePath(path)
  const foundIndex = repos.findIndex((r) => r.path === path)

  if (foundIndex === -1) {
    return repos
  }

  if (repos[foundIndex].isValid) {
    gitService.removeRepo(path)
  }

  repos.splice(foundIndex, 1)

  return persist(repos)
}

import orderBy from 'lodash.orderby'

import * as config from '../../utils/config'

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

export function add(repoPath) {
  const repos = get()
  const name = getNameFromPath(repoPath)

  return persist([
    ...repos,
    { name, path: repoPath }
  ])
}

export function remove(repoPath) {
  const repos = get()
  const foundIndex = repos.findIndex(r => r.path === repoPath)
  if (foundIndex === -1) return repos

  repos.splice(foundIndex, 1)

  return persist(repos)
}

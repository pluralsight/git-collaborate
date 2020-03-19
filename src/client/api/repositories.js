import { ipcRenderer } from 'electron'

import CHANNELS from '../../common/ipc-channels'

export function getAllRepos() {
  return ipcRenderer.sendSync(CHANNELS.GET_ALL_REPOS)
}

export function addRepo(path) {
  return ipcRenderer.sendSync(CHANNELS.ADD_REPO, path)
}

export function removeRepo(path) {
  return ipcRenderer.sendSync(CHANNELS.REMOVE_REPO, path)
}

export function onReposUpdated(callback) {
  ipcRenderer.on(CHANNELS.REPOS_UPDATED, callback)
}

export function removeReposUpdatedListener(callback) {
  ipcRenderer.removeListener(CHANNELS.REPOS_UPDATED, callback)
}

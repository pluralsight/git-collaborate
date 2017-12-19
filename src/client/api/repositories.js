import { ipcRenderer } from 'electron'
import ipcChannels from '../../common/ipcChannels'

export function getAllRepos() {
  return ipcRenderer.sendSync(ipcChannels.GET_ALL_REPOS)
}

export function addRepo(path) {
  ipcRenderer.send(ipcChannels.ADD_REPO, path)
}

export function removeRepo(path) {
  ipcRenderer.send(ipcChannels.REMOVE_REPO, path)
}
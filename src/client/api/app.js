import { ipcRenderer } from 'electron'

import CHANNELS from '../../common/ipc-channels'

export function quit() {
  ipcRenderer.send(CHANNELS.QUIT_APPLICATION)
}

export function getLatestVersion() {
  return ipcRenderer.sendSync(CHANNELS.GET_LATEST_VERSION)
}

export function debug(...args) {
  ipcRenderer.send(CHANNELS.DEBUG, ...args)
}

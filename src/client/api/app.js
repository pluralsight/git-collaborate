import { ipcRenderer } from 'electron'

import ipcChannels from '../../common/ipc-channels'

export function quit() {
  ipcRenderer.send(ipcChannels.QUIT_APPLICATION)
}

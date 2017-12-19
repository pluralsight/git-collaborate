import { ipcRenderer } from 'electron'
import ipcChannels from '../../common/ipcChannels'

export function quit() {
  ipcRenderer.send(ipcChannels.QUIT_APPLICATION)
}
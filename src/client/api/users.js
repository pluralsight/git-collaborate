import { ipcRenderer } from 'electron'
import ipcChannels from '../../common/ipcChannels'


export function getAllUsers() {
  return ipcRenderer.sendSync(ipcChannels.GET_ALL_USERS)
}

export function rotateActiveUsers() {
  return ipcRenderer.sendSync(ipcChannels.ROTATE_ACTIVE_USERS)
}

export function clearActiveUsers() {
  return ipcRenderer.sendSync(ipcChannels.CLEAR_ACTIVE_USERS)
}

export function toggleUserActive(userId) {
  return ipcRenderer.sendSync(ipcChannels.TOGGLE_USER_ACTIVE, userId)
}

export function addUser(user) {
  return ipcRenderer.sendSync(ipcChannels.ADD_USER, user)
}

export function updateUser(user) {
  return ipcRenderer.sendSync(ipcChannels.UPDATE_USER, user)
}

export function removeUser(userId) {
  return ipcRenderer.sendSync(ipcChannels.REMOVE_USER, userId)
}

export function onUsersUpdated(callback) {
  ipcRenderer.on(ipcChannels.USERS_UPDATED, callback)
}

export function removeUsersUpdatedListener(callback) {
  ipcRenderer.removeListener(ipcChannels.USERS_UPDATED, callback)
}
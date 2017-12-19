import { ipcRenderer } from 'electron'
import CHANNELS from '../../common/ipcChannels'


export function getAllUsers() {
  return ipcRenderer.sendSync(CHANNELS.GET_ALL_USERS)
}

export function rotateActiveUsers() {
  return ipcRenderer.sendSync(CHANNELS.ROTATE_ACTIVE_USERS)
}

export function clearActiveUsers() {
  return ipcRenderer.sendSync(CHANNELS.CLEAR_ACTIVE_USERS)
}

export function toggleUserActive(userId) {
  return ipcRenderer.sendSync(CHANNELS.TOGGLE_USER_ACTIVE, userId)
}

export function addUser(user) {
  return ipcRenderer.sendSync(CHANNELS.ADD_USER, user)
}

export function updateUser(user) {
  return ipcRenderer.sendSync(CHANNELS.UPDATE_USER, user)
}

export function removeUser(userId) {
  return ipcRenderer.sendSync(CHANNELS.REMOVE_USER, userId)
}

export function onUsersUpdated(callback) {
  ipcRenderer.on(CHANNELS.USERS_UPDATED, callback)
}

export function removeUsersUpdatedListener(callback) {
  ipcRenderer.removeListener(CHANNELS.USERS_UPDATED, callback)
}
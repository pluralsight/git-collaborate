import { ipcMain } from 'electron'

import CHANNELS from './common/ipc-channels'
import * as userService from './common/services/user'
import * as repoService from './common/services/repo'

export default class IpcRouter {
  app = null

  constructor(app) {
    this.app = app
    this.registerAllListeners()
  }

  registerAllListeners() {
    for (const [event, handler] of Object.entries(this.listeners)) {
      this.on(event, handler)
    }
  }

  on(event, handler) {
    if (!event) throw new Error('Invalid IPC event.')

    ipcMain.on(event, handler)
  }

  handleQuitApplication = () => this.app.quit()

  handleGetUsers = evt => evt.returnValue = userService.get()
  handleRotateActiveUsers = evt => evt.returnValue = userService.rotate()
  handleToggleUserActive = (evt, userId) => evt.returnValue = userService.toggleActive(userId)
  handleAddUser = (evt, user) => evt.returnValue = userService.add(user)
  handleUpdateUser = (evt, user) => evt.returnValue = userService.update(user)
  handleRemoveUser = (evt, userId) => evt.returnValue = userService.remove(userId)

  handleGetAllRepos = evt => evt.returnValue = repoService.get()
  handleAddRepo = (evt, path) => evt.returnValue = repoService.add(path)
  handleRemoveRepo = (evt, path) => evt.returnValue = repoService.remove(path)

  listeners = {
    [CHANNELS.QUIT_APPLICATION]: this.handleQuitApplication,

    [CHANNELS.GET_ALL_USERS]: this.handleGetUsers,
    [CHANNELS.ROTATE_ACTIVE_USERS]: this.handleRotateActiveUsers,
    [CHANNELS.TOGGLE_USER_ACTIVE]: this.handleToggleUserActive,
    [CHANNELS.ADD_USER]: this.handleAddUser,
    [CHANNELS.UPDATE_USER]: this.handleUpdateUser,
    [CHANNELS.REMOVE_USER]: this.handleRemoveUser,

    [CHANNELS.GET_ALL_REPOS]: this.handleGetAllRepos,
    [CHANNELS.ADD_REPO]: this.handleAddRepo,
    [CHANNELS.REMOVE_REPO]: this.handleRemoveRepo
  }
}

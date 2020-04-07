import { ipcMain } from 'electron'

import CHANNELS from './common/ipc-channels'
import { repoService, userService } from './common/services'

export function registerIpcHandlers(app) {
  const handlers = {
    [CHANNELS.QUIT_APPLICATION]: () => app.quit(),

    [CHANNELS.GET_ALL_USERS]: (evt) => { evt.returnValue = userService.get() },
    [CHANNELS.ROTATE_ACTIVE_USERS]: (evt) => { evt.returnValue = userService.rotate() },
    [CHANNELS.TOGGLE_USER_ACTIVE]: (evt, userId) => { evt.returnValue = userService.toggleActive([userId]) },
    [CHANNELS.ADD_USER]: (evt, user) => { evt.returnValue = userService.add(user) },
    [CHANNELS.UPDATE_USER]: (evt, user) => { evt.returnValue = userService.update(user) },
    [CHANNELS.REMOVE_USER]: (evt, userId) => { evt.returnValue = userService.remove([userId]) },

    [CHANNELS.GET_ALL_REPOS]: (evt) => { evt.returnValue = repoService.get() },
    [CHANNELS.ADD_REPO]: (evt, path) => { evt.returnValue = repoService.add(path) },
    [CHANNELS.REMOVE_REPO]: (evt, path) => { evt.returnValue = repoService.remove(path) }
  }

  Object.entries(handlers).map(([channel, func]) => ipcMain.on(channel, func))
}

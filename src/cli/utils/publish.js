import CHANNELS from '../../common/ipc-channels'
import { getMenubar } from '../../common/utils'

export const EVENTS = {
  USERS: 'users',
  REPOS: 'repos'
}

export const publish = (event, data) => {
  const menubar = getMenubar()
  const channel = event === EVENTS.USERS ? CHANNELS.USERS_UPDATED : CHANNELS.REPOS_UPDATED

  if (menubar.app.isReady()) {
    menubar.window.webContents.send(channel, data)
  }
}

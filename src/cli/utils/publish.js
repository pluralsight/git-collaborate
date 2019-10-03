import CHANNELS from '../../common/ipc-channels'
import { getMenubar } from '../../common/utils/menubar'

export const events = {
  users: 'users',
  repos: 'repos'
}

export const publish = (event, data) => {
  const menubar = getMenubar()
  const channel = event === events.users ? CHANNELS.USERS_UPDATED : CHANNELS.REPOS_UPDATED

  if (menubar.app.isReady()) {
    menubar.window.webContents.send(channel, data)
  }
}

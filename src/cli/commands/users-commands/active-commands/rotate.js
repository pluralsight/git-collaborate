import CHANNELS from '../../../../common/ipc-channels'
import { getMenubar } from '../../../../common/utils/menubar'
import { showCurrentAuthors } from '../../../../common/services/notification'
import { getNotificationLabel } from '../../../../common/utils/string'
import { rotate } from '../../../../common/services/user'

export const command = 'rotate'
export const describe = 'Rotate active users'

export const builder = yargs =>
  yargs
    .usage('Usage:\n  git-switch users active rotate')
    .version(false)

export const handler = () => {
  const updatedUsers = rotate()
  const activeUserCount = updatedUsers.filter(u => u.active).length

  if (activeUserCount > 1) {
    const label = getNotificationLabel(activeUserCount, true)
    showCurrentAuthors({ title: `${label} rotated to:` })
    getMenubar().window.webContents.send(CHANNELS.USERS_UPDATED, updatedUsers)
  }
}

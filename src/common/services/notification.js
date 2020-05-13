import { Notification } from 'electron'
import path from 'path'

import { userService } from './'
import { formatActiveUserFirstNames, getNotificationLabel } from '../utils'

const icon = path.join(__dirname, 'assets', 'icon.png')
const sound = 'Purr'

function showNotification(config) {
  const notification = new Notification(config)
  notification.show()
}

export function showCurrentAuthors(didRotate = false) {
  const users = userService.get()
  const activeUserCount = users.filter((u) => u.active).length

  const label = getNotificationLabel(activeUserCount, didRotate)
  const title = didRotate ? `${label} rotated to:` : `Current ${label}:`
  const body = formatActiveUserFirstNames(users)

  showNotification({ body, icon, sound, title })
}

export function showUpdateAvailable() {
  showNotification({
    body: 'There is a new version of git-switch available',
    icon,
    sound,
    title: 'Update available'
  })
}

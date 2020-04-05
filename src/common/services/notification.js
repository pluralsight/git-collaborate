import { Notification } from 'electron'

import { userService } from './'
import { formatActiveUserFirstNames, getNotificationLabel } from '../utils'

function showNotification(config) {
  const notification = new Notification(config)
  notification.show()
}

export function showCurrentAuthors(didRotate = false) {
  const users = userService.get()
  const activeUserCount = users.filter(u => u.active).length

  const label = getNotificationLabel(activeUserCount, didRotate)
  const title = didRotate ? `${label} rotated to:` : `Current ${label}:`

  showNotification({
    title,
    sound: 'Purr',
    body: formatActiveUserFirstNames(users)
  })
}

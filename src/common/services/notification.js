import { Notification } from 'electron'

import { userService } from './'
import { formatActiveUserFirstNames, getNotificationLabel } from '../utils'

function showNotification(config) {
  const notification = new Notification(config)
  notification.show()
}

export function showCurrentAuthors(options = {}) {
  const users = userService.get()
  const activeUserCount = users.filter(u => u.active).length

  showNotification({
    title: options.title || `Current ${getNotificationLabel(activeUserCount)}:`,
    sound: 'Purr',
    body: formatActiveUserFirstNames(users)
  })
}

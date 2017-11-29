import { Notification } from 'electron'
import { formatActiveUserFirstNames, getCommiterLabel } from '../../utils/string'
import * as userService from './user'

function showNotification(config) {
  const notification = new Notification(config)
  notification.show()
}

export function showCurrentCommiters(options = {}) {
  const users = userService.get()
  const activeUserCount = users.filter(u => u.active).length

  showNotification({
    title: options.title || `Current ${getCommiterLabel(activeUserCount)}:`,
    sound: 'Purr',
    body: formatActiveUserFirstNames(users)
  })
}

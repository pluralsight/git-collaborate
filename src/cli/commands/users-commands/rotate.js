import { getNotificationLabel } from '../../../common/utils/string'
import { get as getUsers, rotate } from '../../../common/services/user'
import { events, publish, showNotification } from '../../utils'

export const command = 'rotate'
export const describe = 'Rotate active users'

export const builder = yargs =>
  yargs
    .usage('Usage:\n  git-switch users rotate')
    .version(false)

export const handler = args => {
  const { doWork, verbose } = args
  let updatedUsers

  if (doWork) {
    updatedUsers = rotate()
  } else {
    updatedUsers = getUsers()
  }

  const activeUserCount = updatedUsers.filter(u => u.active).length

  if (verbose && activeUserCount > 1) {
    const label = getNotificationLabel(activeUserCount, true)
    showNotification({ title: `${label} rotated to:` })
    publish(events.users, updatedUsers)
  }
}

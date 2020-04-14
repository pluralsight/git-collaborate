import { userService, notificationService } from '../../../common/services'
import { EVENTS, publish } from '../../utils'

export const command = 'rotate'
export const describe = 'Rotate active users'

export const builder = (yargs) =>
  yargs
    .usage('Usage:\n  git-switch users rotate')
    .version(false)

export const handler = (args) => {
  const { doWork, verbose } = args
  let updatedUsers

  if (doWork) {
    updatedUsers = userService.rotate()
  } else {
    updatedUsers = userService.get()
  }

  const activeUserCount = updatedUsers.filter((u) => u.active).length

  if (verbose && activeUserCount > 1) {
    publish(EVENTS.USERS, updatedUsers)

    notificationService.showCurrentAuthors(true)
  }
}

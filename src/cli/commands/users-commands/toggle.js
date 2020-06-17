import { userService, notificationService } from '../../../common/services'
import { EVENTS, publish } from '../../utils'

export const command = ['toggle [userIds..]', 'to']
export const describe = 'Toggle users\' active status'

export const builder = (yargs) =>
  yargs
    .usage('Usage:\n  git-collab users toggle [userIds..]')
    .positional('userIds', {
      describe: 'The ids/names of the users to toggle (name is case-insensitive)',
      string: true,
      array: true,
      demandOption: true
    })
    .version(false)

export const handler = (args) => {
  const { userIds, doWork, verbose } = args

  let updatedUsers
  if (doWork) {
    updatedUsers = userService.toggleActive(userIds)
  } else {
    updatedUsers = userService.get()
  }

  if (verbose) {
    publish(EVENTS.USERS, updatedUsers)
    notificationService.showCurrentAuthors()
  }
}

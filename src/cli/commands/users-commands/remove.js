import { userService } from '../../../common/services'
import { EVENTS, publish } from '../../utils'

export const command = ['remove [userIds..]', 'rm']
export const describe = 'Remove users'

export const builder = (yargs) =>
  yargs
    .usage('Usage:\n  git-collab users remove [userIds]')
    .positional('userIds', {
      describe: 'The ids/names of the users to remove (name is case-insensitive)',
      string: true,
      array: true,
      demandOption: true
    })
    .version(false)

export const handler = (args) => {
  const { userIds, doWork, verbose } = args

  let updatedUsers
  if (doWork) {
    updatedUsers = userService.remove(userIds)
  } else {
    updatedUsers = userService.get()
  }

  if (verbose) {
    publish(EVENTS.USERS, updatedUsers)
  }
}

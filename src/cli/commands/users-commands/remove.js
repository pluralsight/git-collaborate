import { userService } from '../../../common/services'
import { EVENTS, publish } from '../../utils'

export const command = 'remove [userIds..]'
export const describe = 'Remove users'

export const builder = yargs =>
  yargs
    .usage('Usage:\n  git-switch users remove [userIds]')
    .positional('userIds', {
      describe: 'The ids of the users to remove',
      string: true,
      array: true,
      demandOption: true
    })
    .version(false)

export const handler = args => {
  const { userIds, doWork, verbose } = args

  let updatedUsers
  if (doWork) {
    for (const id of userIds) {
      updatedUsers = userService.remove(id)
    }
  } else {
    updatedUsers = userService.get()
  }

  if (verbose) {
    publish(EVENTS.USERS, updatedUsers)
  }
}

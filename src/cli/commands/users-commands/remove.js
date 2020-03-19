import { get as getUsers, remove as removeUser } from '../../../common/services/user'
import { events, publish } from '../../utils'

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
      updatedUsers = removeUser(id)
    }
  } else {
    updatedUsers = getUsers()
  }

  if (verbose) {
    publish(events.users, updatedUsers)
  }
}

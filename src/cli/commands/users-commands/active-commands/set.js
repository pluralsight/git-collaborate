import { get as getUsers, toggleActive } from '../../../../common/services/user'
import { events, publish, showNotification } from '../../../utils'

export const command = 'set [userIds..]'
export const describe = 'Manage users\' active status'

export const builder = yargs =>
  yargs
    .usage('Usage:\n  git-switch users active set [userIds..]')
    .options({
      isActive: {
        alias: 'a',
        describe: 'Set the users\' isActive flag',
        boolean: true,
        default: true
      }
    })
    .positional('userIds', {
      describe: 'The ids of the users to set',
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
      updatedUsers = toggleActive(id)
    }
  } else {
    updatedUsers = getUsers()
  }

  if (verbose) {
    showNotification()
    publish(events.users, updatedUsers)
  }
}

import { get as getUsers, toggleActive } from '../../../common/services/user'
import { events, publish, showNotification } from '../../utils'

export const command = 'toggle [userIds..]'
export const describe = `Toggle users' active status`

export const builder = yargs =>
  yargs
    .usage('Usage:\n  git-switch users toggle [userIds..]')
    .positional('userIds', {
      describe: 'The ids of the users to toggle',
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

import { userService } from '../../../common/services'
import { EVENTS, publish, logger } from '../../utils'

export const command = 'edit [userId]'
export const describe = 'Edit an existing user'

export const builder = yargs =>
  yargs
    .usage('Usage:\n  git-switch users edit <userId> [options]')
    .positional('userId', {
      describe: 'The id of the users to edit',
      string: true,
      demandOption: true
    })
    .options({
      name: {
        alias: 'n',
        describe: 'The user\'s name',
        string: true
      },
      email: {
        alias: 'e',
        describe: 'The user\'s email address',
        string: true
      },
      key: {
        alias: 'k',
        describe: 'The path to the user\'s rsa key',
        string: true
      }
    })
    .version(false)

export const handler = args => {
  const { userId, name, email, key, doWork, verbose } = args
  const users = userService.get()

  let updatedUsers
  if (doWork) {
    const user = users.find(u => u.id === userId)
    if (!user) {
      logger.error('User not found')
      return
    }

    const rsaKeyPath = key == null ? user.rsaKeyPath : key

    updatedUsers = userService.update({
      ...user,
      name: name || user.name,
      email: email || user.email,
      rsaKeyPath
    })
  } else {
    updatedUsers = users
  }

  if (verbose) {
    publish(EVENTS.USERS, updatedUsers)
  }
}

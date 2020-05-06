import { userService } from '../../../common/services'
import { EVENTS, publish, logger } from '../../utils'

export const command = ['edit [userId]', 'up', 'update']
export const describe = 'Edit an existing user'

export const builder = (yargs) =>
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
      },
      host: {
        alias: 'H',
        describe: 'The host the rsa key is issued to',
        string: true
      }
    })
    .version(false)

export const handler = (args) => {
  const { doWork, verbose } = args
  const users = userService.get()

  let updatedUsers
  if (doWork) {
    const { userId, name, email, key, host } = args

    const user = users.find((u) => u.id === userId)
    if (!user) {
      logger.error('User not found')
      return
    }

    const updatedUser = {
      ...user,
      name: name || user.name,
      email: email || user.email,
      rsaKeyPath: key == null ? user.rsaKeyPath : key,
      sshHost: host == null ? user.sshHost : host
    }
    if (updatedUser.sshHost && !updatedUser.rsaKeyPath) {
      delete updatedUser.sshHost
    }

    updatedUsers = userService.update(updatedUser)
  } else {
    updatedUsers = users
  }

  if (verbose) {
    publish(EVENTS.USERS, updatedUsers)
  }
}

import { userService, notificationService } from '../../../common/services'
import { EVENTS, publish } from '../../utils'

export const command = ['add', 'new']
export const describe = 'Add a new user'

export const builder = (yargs) =>
  yargs
    .usage('Usage:\n  git-collab users add [options]')
    .options({
      name: {
        alias: 'n',
        describe: 'The user\'s name',
        string: true,
        demandOption: true
      },
      email: {
        alias: 'e',
        describe: 'The user\'s email address',
        string: true,
        demandOption: true
      },
      key: {
        alias: 'k',
        describe: 'The path to the user\'s rsa key',
        string: true,
        default: ''
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

  let updatedUsers
  if (doWork) {
    const { name, email, key: rsaKeyPath, host } = args

    const userToAdd = { name, email, rsaKeyPath }
    if (host) {
      userToAdd.sshHost = host
    }

    updatedUsers = userService.add(userToAdd)
  } else {
    updatedUsers = userService.get()
  }

  if (verbose) {
    publish(EVENTS.USERS, updatedUsers)
    notificationService.showCurrentAuthors()
  }
}

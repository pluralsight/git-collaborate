import { userService, notificationService } from '../../../common/services'
import { EVENTS, publish } from '../../utils'

export const command = 'add'
export const describe = 'Add a new user'

export const builder = yargs =>
  yargs
    .usage('Usage:\n  git-switch users add [options]')
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
      }
    })
    .version(false)

export const handler = args => {
  const { name, email, key: rsaKeyPath, doWork, verbose } = args

  let updatedUsers
  if (doWork) {
    updatedUsers = userService.add({ name, email, rsaKeyPath })
  } else {
    updatedUsers = userService.get()
  }

  if (verbose) {
    publish(EVENTS.USERS, updatedUsers)
    notificationService.showCurrentAuthors()
  }
}

import { add as addUser, get as getUsers } from '../../../common/services/user'
import { events, publish, showNotification } from '../../utils'

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
    updatedUsers = addUser({ name, email, rsaKeyPath })
  } else {
    updatedUsers = getUsers()
  }

  if (verbose) {
    showNotification()
    publish(events.users, updatedUsers)
  }
}

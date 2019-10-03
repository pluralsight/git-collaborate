import CHANNELS from '../../../common/ipc-channels'
import { getMenubar } from '../../../common/utils/menubar'
import { showCurrentAuthors } from '../../../common/services/notification'
import { add as addUser } from '../../../common/services/user'

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
  const { name, email, key: rsaKeyPath } = args
  const updatedUsers = addUser({ name, email, rsaKeyPath })

  showCurrentAuthors()
  getMenubar().window.webContents.send(CHANNELS.USERS_UPDATED, updatedUsers)
}

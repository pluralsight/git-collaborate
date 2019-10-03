import CHANNELS from '../../../../common/ipc-channels'
import { getMenubar } from '../../../../common/utils/menubar'
import { showCurrentAuthors } from '../../../../common/services/notification'
import { toggleActive } from '../../../../common/services/user'

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
  const { userIds } = args

  let updatedUsers
  for (const id of userIds) {
    updatedUsers = toggleActive(id)
  }

  showCurrentAuthors()
  getMenubar().window.webContents.send(CHANNELS.USERS_UPDATED, updatedUsers)
}

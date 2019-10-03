import CHANNELS from '../../../common/ipc-channels'
import { getMenubar } from '../../../common/utils/menubar'
import { remove as removeUser } from '../../../common/services/user'

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
  const { userIds } = args

  let updatedUsers
  for (const id of userIds) {
    updatedUsers = removeUser(id)
  }

  getMenubar().window.webContents.send(CHANNELS.USERS_UPDATED, updatedUsers)
}

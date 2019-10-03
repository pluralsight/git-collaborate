import CHANNELS from '../../../common/ipc-channels'
import { getMenubar } from '../../../common/utils/menubar'
import { add as addRepo } from '../../../common/services/repo'

export const command = 'add [paths..]'
export const describe = 'Add repositories'

export const builder = yargs =>
  yargs
    .usage('Usage:\n  git-switch repos add [paths]')
    .positional('paths', {
      describe: 'The paths of repositories to add',
      string: true,
      array: true,
      demandOption: true
    })
    .version(false)

export const handler = async args => {
  const { paths } = args

  let updatedRepos = []
  for (const path of paths) {
    updatedRepos = await addRepo(path)
  }

  getMenubar().window.webContents.send(CHANNELS.REPOS_UPDATED, updatedRepos)
}

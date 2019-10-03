import CHANNELS from '../../../common/ipc-channels'
import { getMenubar } from '../../../common/utils/menubar'
import { remove as removeRepo } from '../../../common/services/repo'

export const command = 'remove [paths..]'
export const describe = 'Remove repositories'

export const builder = yargs =>
  yargs
    .usage('Usage:\n  git-switch repos remove [paths]')
    .positional('paths', {
      describe: 'The paths of the repos to remove',
      string: true,
      array: true,
      demandOption: true
    })
    .version(false)

export const handler = args => {
  const { paths } = args

  let updatedRepos
  for (const path of paths) {
    updatedRepos = removeRepo(path)
  }

  getMenubar().window.webContents.send(CHANNELS.REPOS_UPDATED, updatedRepos)
}

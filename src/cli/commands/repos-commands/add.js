import { add as addRepo, get as getRepos } from '../../../common/services/repo'
import { events, publish } from '../../utils'

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
  const { paths, doWork, verbose } = args

  let updatedRepos = []
  if (doWork) {
    for (const path of paths) {
      updatedRepos = await addRepo(path)
    }
  } else {
    updatedRepos = getRepos()
  }

  if (verbose) {
    publish(events.repos, updatedRepos)
  }
}

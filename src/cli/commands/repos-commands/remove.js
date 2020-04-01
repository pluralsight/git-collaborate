import { repoService } from '../../../common/services'
import { EVENTS, publish } from '../../utils'

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
  const { paths, doWork, verbose } = args

  let updatedRepos
  if (doWork) {
    for (const path of paths) {
      updatedRepos = repoService.remove(path)
    }
  } else {
    updatedRepos = repoService.get()
  }

  if (verbose) {
    publish(EVENTS.REPOS, updatedRepos)
  }
}

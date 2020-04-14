import { repoService } from '../../../common/services'
import { EVENTS, publish } from '../../utils'

export const command = 'add [paths..]'
export const describe = 'Add repositories'

export const builder = (yargs) =>
  yargs
    .usage('Usage:\n  git-switch repos add [paths]')
    .positional('paths', {
      describe: 'The paths of repositories to add',
      string: true,
      array: true,
      demandOption: true
    })
    .version(false)

export const handler = (args) => {
  const { paths, doWork, verbose } = args

  let updatedRepos = []
  if (doWork) {
    for (const path of paths) {
      updatedRepos = repoService.add(path)
    }
  } else {
    updatedRepos = repoService.get()
  }

  if (verbose) {
    publish(EVENTS.REPOS, updatedRepos)
  }
}

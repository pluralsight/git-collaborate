import yargs from 'yargs'

import { quit, repos, show, users } from './commands'

export const handleCli = args => yargs(args)
  .usage('Usage:\n  git-switch <command> [options]')
  .options({
    verbose: {
      alias: 'v',
      describe: 'Publish changes to UI and show notifications',
      boolean: true,
      default: false,
      hidden: true
    },
    doWork: {
      alias: 'd',
      describe: 'When `doWork` is false the command will only be run to provide information to the primary instance of the app--no changes will be made',
      boolean: true,
      default: true,
      hidden: true
    }
  })
  .command(quit)
  .command(repos)
  .command(show)
  .command(users)
  .help()
  .alias('h', 'help')
  .argv

import yargs from 'yargs'

export const processCli = args => yargs(args)
  .usage('Usage:\n  git-switch <command> [options]')
  .commandDir('commands')
  .help()
  .alias('h', 'help')
  .argv

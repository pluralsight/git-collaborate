export const command = 'repos'
export const describe = 'Manage repositories'

export const builder = yargs =>
  yargs
    .usage('Usage:\n  git-switch repos <command> [options]')
    .commandDir('repos-commands')
    .demandCommand(1, 'You must specify a command and options')
    .version(false)

export const handler = () => {}

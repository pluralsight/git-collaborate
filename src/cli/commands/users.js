export const command = 'users'
export const describe = 'Manage users'

export const builder = yargs =>
  yargs
    .usage('Usage:\n  git-switch users <command> [options]')
    .commandDir('users-commands')
    .demandCommand(1, 'You must specify a command and options')
    .version(false)

export const handler = () => {}

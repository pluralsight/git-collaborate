export const command = 'active'
export const describe = 'Manage active users'

export const builder = yargs =>
  yargs
    .usage('Usage:\n  git-switch users active <command> [options]')
    .commandDir('active-commands')
    .demandCommand(1, 'You must specify a command and options')
    .version(false)

export const handler = () => {}

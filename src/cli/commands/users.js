import { add, edit, list, remove, rotate, toggle } from './users-commands'

export const command = ['users', 'u']
export const describe = 'Manage users'

export const builder = (yargs) =>
  yargs
    .usage('Usage:\n  git-collab users <command> [options]')
    .command(add)
    .command(edit)
    .command(list)
    .command(remove)
    .command(rotate)
    .command(toggle)
    .demandCommand(1, 'You must specify a command and options')
    .version(false)

export const handler = () => {}

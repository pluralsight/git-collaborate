import { add, list, remove } from './repos-commands'

export const command = 'repos'
export const describe = 'Manage repositories'

export const builder = (yargs) =>
  yargs
    .usage('Usage:\n  git-switch repos <command> [options]')
    .command(add)
    .command(list)
    .command(remove)
    .demandCommand(1, 'You must specify a command and options')
    .version(false)

export const handler = () => {}

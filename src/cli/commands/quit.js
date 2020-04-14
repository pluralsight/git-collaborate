import { getMenubar } from '../utils'

export const command = 'quit'
export const describe = 'Quit running git-switch client'

export const builder = (yargs) =>
  yargs
    .usage('Usage:\n  git-switch quit')
    .version(false)

export const handler = (args) => {
  const { doWork } = args

  // quit first instance
  if (!doWork) {
    getMenubar().app.quit()
  }
}

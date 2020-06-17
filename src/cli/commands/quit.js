import { getMenubar } from '../utils'

export const command = ['quit', 'q']
export const describe = 'Quit running git-collab client'

export const builder = (yargs) =>
  yargs
    .usage('Usage:\n  git-collab quit')
    .version(false)

export const handler = (args) => {
  const { doWork } = args

  // quit first instance
  if (!doWork) {
    getMenubar().app.quit()
  }
}

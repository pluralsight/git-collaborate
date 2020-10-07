import { getMenubar } from '../utils'

export const command = ['show', 's']
export const describe = 'Show and focus running git-collab client'

export const builder = (yargs) =>
  yargs
    .usage('Usage:\n  git-collab show')
    .version(false)

export const handler = (args) => {
  const { doWork } = args

  // show window of first instance
  if (!doWork) {
    getMenubar().showWindow()
  }
}

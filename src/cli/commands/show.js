import { getMenubar } from '../utils'

export const command = 'show'
export const describe = 'Show and focus running git-switch client'

export const builder = (yargs) =>
  yargs
    .usage('Usage:\n  git-switch show')
    .version(false)

export const handler = (args) => {
  const { doWork } = args

  // show window of first instance
  if (!doWork) {
    getMenubar().showWindow()
  }
}

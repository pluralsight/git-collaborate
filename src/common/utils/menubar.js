import { menubar } from 'menubar'

let mb = null

export const getMenubar = (config = null) => {
  if (!mb) {
    if (!config) throw new Error('config is required')

    mb = menubar(config)
  }

  return mb
}

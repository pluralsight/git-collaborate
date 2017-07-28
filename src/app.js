import menubar from 'menubar'
import * as path from 'path'

const isDev = process.env.NODE_ENV === 'dev'

function getMenuConfig() {
  if (isDev)
    return { height: 780, width: 1080 }

  return { height: 400, width: 400 }
}

const mb = menubar({
  dir: __dirname,
  index: 'file://' + path.join(__dirname, 'build', 'index.html'),
  preloadWindow: true,
  ...getMenuConfig()
})

mb.on('after-create-window', () => {
  if (isDev)
    mb.window.openDevTools()
})

const menubar = require('menubar')
const path = require('path')

const install = require('./utils/install')

install()
const isDev = process.env.NODE_ENV === 'dev'

function getMenuConfig() {
  if (isDev)
    return { height: 600, width: 800 }

  return { height: 600, width: 400 }
}

const menuBarOpts = {
  dir: __dirname,
  index: 'file://' + path.join(__dirname, 'build', 'index.html'),
  preloadWindow: true
}
const mb = menubar(Object.assign({}, menuBarOpts, getMenuConfig()))

mb.on('after-create-window', () => {
  if (isDev) mb.window.openDevTools()
})

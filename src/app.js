const menubar = require('menubar')
const path = require('path')

const install = require('./utils/install')

install()
const isDev = process.env.NODE_ENV === 'dev'

const mb = menubar({
  dir: __dirname,
  index: 'file://' + path.join(__dirname, 'build', 'index.html'),
  preloadWindow: true,
  alwaysOnTop: isDev,
  width: isDev ? 800 : 400,
  height: 600
})

mb.on('after-create-window', () => {
  if (isDev) mb.window.openDevTools()
})
mb.on('ready', () => {
  if (isDev) mb.showWindow()
})

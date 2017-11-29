import menubar from 'menubar'
import path from 'path'

import * as notificationService from './client/services/notification'
import * as userService from './client/services/user'
import { getCommiterLabel } from './utils/string'

import install from'./utils/install'
install()

const isDev = process.env.NODE_ENV === 'dev'

const state = { rotateOnOpen: false }

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

  state.isReady = true

  if (state.rotateOnOpen) {
    rotateUsers()
    state.rotateOnOpen = false
  } else {
    notificationService.showCurrentCommiters()
  }
})

mb.app.on('open-url', (event, url) => {
  event.preventDefault()
  const urlPath = url.slice(13).split('/')

  if (urlPath[0] === 'rotate') {
    if (mb.app.isReady()) {
      rotateUsers()
    } else {
      state.rotateOnOpen = true
    }
  }
})

function rotateUsers() {
  const activeUserCount = userService.rotate().filter(u => u.active).length
  if (activeUserCount > 1) {
    const label = getCommiterLabel(activeUserCount, true)
    notificationService.showCurrentCommiters({title: `${label} rotated to:`})
    mb.window.webContents.send('users-updated', userService.get())
  }
}

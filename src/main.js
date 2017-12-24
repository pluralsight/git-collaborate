import menubar from 'menubar'
import path from 'path'

import CHANNELS from './common/ipc-channels'
import * as notificationService from './common/services/notification'
import * as userService from './common/services/user'
import { getCommiterLabel } from './common/utils/string'
import install from './common/utils/install'
import IpcRouter from './ipc-router'

const isDev = process.env.NODE_ENV === 'dev'
const state = { rotateOnOpen: false }

install()

const mb = menubar({
  dir: __dirname,
  index: 'file://' + path.join(__dirname, '..', 'src', 'build', 'index.html'),
  preloadWindow: true,
  alwaysOnTop: isDev,
  width: isDev ? 800 : 400,
  height: 600
})

mb.on('ready', handleAppReady)
mb.on('after-create-window', handleAfterCreateWindow)
mb.app.on('open-url', handleOpenUrl)

function handleAppReady() {
  if (isDev) mb.showWindow()

  state.isReady = true

  new IpcRouter(mb.app)

  if (state.rotateOnOpen) {
    rotateUsers()
    state.rotateOnOpen = false
  } else if (!isDev) {
    notificationService.showCurrentCommiters()
  }
}

function handleAfterCreateWindow() {
  if (isDev) mb.window.openDevTools()
}

function handleOpenUrl(event, url) {
  event.preventDefault()
  const urlPath = url.slice(13).split('/')

  if (urlPath[0] === 'rotate') {
    if (mb.app.isReady()) {
      rotateUsers()
    } else {
      state.rotateOnOpen = true
    }
  }
}

function rotateUsers() {
  const updatedUsers = userService.rotate()
  const activeUserCount = updatedUsers.filter(u => u.active).length
  if (activeUserCount > 1) {
    const label = getCommiterLabel(activeUserCount, true)
    notificationService.showCurrentCommiters({ title: `${label} rotated to:` })
    mb.window.webContents.send(CHANNELS.USERS_UPDATED, updatedUsers)
  }
}

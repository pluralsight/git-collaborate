import { menubar } from 'menubar'
import path from 'path'

import CHANNELS from './common/ipc-channels'
import * as notificationService from './common/services/notification'
import * as userService from './common/services/user'
import { getNotificationLabel } from './common/utils/string'
import install from './common/utils/install'
import IpcRouter from './ipc-router'

const state = {
  isDev: process.env.NODE_ENV === 'dev',
  rotateOnOpen: false
}

const mb = menubar({
  browserWindow: {
    alwaysOnTop: state.isDev,
    height: 600,
    width: state.isDev ? 800 : 400
  },
  dir: __dirname,
  icon: path.join(__dirname, 'assets', 'icons', 'trayIconTemplate.png'),
  index: 'file://' + path.join(__dirname, '..', 'src', 'build', 'index.html'),
  preloadWindow: true
})

function handleAppReady() {
  if (state.isDev) mb.showWindow()

  new IpcRouter(mb.app)

  if (state.rotateOnOpen) {
    rotateUsers()
    state.rotateOnOpen = false
  } else if (!state.isDev) {
    notificationService.showCurrentAuthors()
  }
}

function handleAfterCreateWindow() {
  if (state.isDev) mb.window.openDevTools()
}

function rotateUsers() {
  const updatedUsers = userService.rotate()
  const activeUserCount = updatedUsers.filter(u => u.active).length
  if (activeUserCount > 1) {
    const label = getNotificationLabel(activeUserCount, true)
    notificationService.showCurrentAuthors({ title: `${label} rotated to:` })
    mb.window.webContents.send(CHANNELS.USERS_UPDATED, updatedUsers)
  }
}

function processAppArgs(args) {
  if (args.length < 2) return

  const options = args.slice(1)
  if (options.some(o => o === 'rotate')) {
    if (mb.app.isReady()) {
      rotateUsers()
    } else {
      state.rotateOnOpen = true
    }
  }
}

function startUp() {
  const isSecondInstance = !mb.app.requestSingleInstanceLock()
  if (isSecondInstance) {
    mb.app.exit()
    return
  }

  mb.on('ready', handleAppReady)
  mb.on('after-create-window', handleAfterCreateWindow)
  mb.app.on('second-instance', (_, argv) => {
    processAppArgs(argv)
  })

  processAppArgs(process.argv)

  const appExecutablePath = mb.app.getPath('exe')
  install(process.platform, appExecutablePath)
}

startUp()

import path from 'path'

import { processCli } from './cli'
import install from './common/utils/install'
import IpcRouter from './ipc-router'
import { getMenubar } from './common/utils/menubar'
import { showCurrentAuthors } from './common/services/notification'

const state = {
  isDev: process.env.NODE_ENV === 'dev',
  startupArgs: []
}

const mb = getMenubar({
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

  if (state.startupArgs.length) {
    processCli(state.startupArgs)
    state.startupArgs = []
  } else if (!state.isDev) {
    showCurrentAuthors()
  }
}

function handleAfterCreateWindow() {
  if (state.isDev) mb.window.openDevTools()
}

function processAppArgs(args) {
  const regex = /([/\\]node_modules)|(^\.$)/ // contains node_modules dir (i.e. running with npm) or equals '.'
  const filteredArgs = args.filter(arg => !regex.test(arg))

  if (mb.app.isReady()) {
    processCli(filteredArgs)
  } else {
    state.startupArgs = filteredArgs
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
  mb.app.on('second-instance', (_, argv) => processAppArgs(argv))

  processAppArgs(process.argv)

  const appExecutablePath = mb.app.getPath('exe')
  install(process.platform, appExecutablePath)
}

startUp()

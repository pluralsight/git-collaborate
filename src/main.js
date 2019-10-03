import path from 'path'

import { handleCli } from './cli'
import install from './common/utils/install'
import IpcRouter from './ipc-router'
import { getMenubar } from './common/utils/menubar'
import { showCurrentAuthors } from './common/services/notification'

const isDev = process.env.NODE_ENV === 'dev'

const handleAppReady = menubar => () => {
  new IpcRouter(menubar.app)

  if (isDev) {
    menubar.showWindow()
  } else {
    showCurrentAuthors()
  }
}

const handleAfterCreateWindow = menubar => () => {
  if (isDev) {
    menubar.window.openDevTools()
  }
}

const handleSecondInstanceArgs = args => {
  if (args.includes('--help')) return

  // update the ui and give notifications to the user, but do not make changes
  args = [...args, '--verbose', '--doWork', 'false']

  setTimeout(() => handleCli(args), 100)
}

const getCliArgs = args => {
  // contains `node_modules` dir (i.e. running with npm), is the `git-switch` command, or equals '.'
  const regex = /([/\\]?(node_modules|git-switch))|(^\.$)/

  return args.filter(arg => !regex.test(arg))
}

const startUp = () => {
  const menubar = getMenubar({
    browserWindow: {
      alwaysOnTop: isDev,
      height: 600,
      width: isDev ? 800 : 400
    },
    dir: __dirname,
    icon: path.join(__dirname, 'assets', 'icons', 'trayIconTemplate.png'),
    index: 'file://' + path.join(__dirname, '..', 'src', 'build', 'index.html'),
    preloadWindow: true
  })

  const isPrimaryInstance = menubar.app.requestSingleInstanceLock()
  const cliArgs = getCliArgs(process.argv)

  if (!isPrimaryInstance || cliArgs.length) {
    handleCli(cliArgs)
    return menubar.app.exit()
  }

  menubar.on('ready', handleAppReady(menubar))
  menubar.on('after-create-window', handleAfterCreateWindow(menubar))
  menubar.app.on('second-instance', (_, argv) => handleSecondInstanceArgs(getCliArgs(argv)))

  const appExecutablePath = menubar.app.getPath('exe')
  install(process.platform, appExecutablePath)
}

startUp()

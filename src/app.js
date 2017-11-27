import { Notification, protocol } from 'electron'
import menubar from 'menubar'
import path from 'path'

import * as userService from './client/services/user'

import install from './utils/install'

install()
const isDev = process.env.NODE_ENV === 'dev'

const mb = menubar({
  dir: __dirname,
  index: 'file://' + path.join(__dirname, 'build', 'index.html'),
  // preloadWindow: true,
  // alwaysOnTop: isDev,
  width: isDev ? 800 : 400,
  height: 600
})

mb.on('after-create-window', () => {
  if (isDev) mb.window.openDevTools()
})
mb.on('ready', () => {
  // if (isDev) mb.showWindow()

  // if (Notification.isSupported()) {
  //   const newPair = userService.get()
  //   .filter(u => u.active)
  //   .map(u => u.name.split(' ')[0])
  //   .join(', ')
  //
  //   console.log('users', userService.get())
  //   const notification = new Notification({
  //     title: 'Current pair',
  //     silent: true,
  //     body: `${newPair}`
  //   })
  //
  //   notification.show()
  // }

  // swapPairs()
})

mb.app.on('open-url', (event, url) => {
  event.preventDefault()
  swapPairs()
})


function swapPairs() {
  const newUsers = userService.rotate()
  const newPair = newUsers.filter(u => u.active)
  .map(u => u.name.split(' ')[0])
  .join(', ')

  if (Notification.isSupported()) {
    const notification = new Notification({
      title: 'Pair rotated',
      body: newPair
    })

    notification.show()
  }
}
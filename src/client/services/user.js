import fs from 'fs'
import os from 'os'
import path from 'path'
import uuid from 'uuid/v4'

const CONFIG_FILE_PATH = path.join(os.homedir(), '.git-switch.json')

export function get() {
  return getConfig().users
}

export function add({ name, email, rsaKeyPath }) {
  const users = get()
  const id = uuid()
  users.push({ id, name, email, rsaKeyPath, active: true })

  return persist(users)
}

export function update(user) {
  const users = get()
  const foundIndex = users.findIndex(u => u.id === user.id)
  if (foundIndex !== -1) {
    users[foundIndex] = user
  } else {
    users.push(user)
  }

  return persist(users)
}

export function remove({ id }) {
  const users = get()
  const foundIndex = users.findIndex(u => u.id === id)
  if (foundIndex === -1) return

  users.splice(foundIndex)

  return persist(users)
}

export function rotate() {
  const users = get()
  const activeUsers = users.filter(u => u.active)
  if (!activeUsers.length || activeUsers.length === 1) return users

  const inactiveUsers = users.filter(u => !u.active)
  const updatedUsers = [
    ...activeUsers.slice(1),
    activeUsers[0],
    ...inactiveUsers
  ]

  return persist(updatedUsers)
}

export function toggleActive(userId) {
  const users = get()
  const user = users.find(u => u.id === userId)
  if (!user) return users

  const activeUsers = users.filter(u => u.active && u.id !== userId)
  const inactiveUsers = users.filter(u => !u.active && u.id !== userId)

  user.active = !user.active
  return persist([
    ...activeUsers,
    user,
    ...inactiveUsers
  ])
}

export function clearActive() {
  const users = get()
  const updatedUsers = users.map(u => ({ ...u, active: false }))

  return persist(updatedUsers)
}

function configFileExists() {
  return fs.existsSync(CONFIG_FILE_PATH)
}

function getDefaultConfig() {
  return {
    users: []
  }
}

function getConfig() {
  return configFileExists()
    ? JSON.parse(fs.readFileSync(CONFIG_FILE_PATH))
    : getDefaultConfig()
}

function setConfig(config) {
  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2))
}

function persist(users) {
  const config = getConfig()
  config.users = users
  setConfig(config)

  return users
}

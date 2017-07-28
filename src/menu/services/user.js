import fs from 'fs'
import path from 'path'
import os from 'os'

const CONFIG_FILE_PATH = path.join(os.homedir(), '.git-switch.json')

export function getUsers() {
  return getConfig().users || []
}

export function updateUser(user) {
  const users = getUsers()
  const foundIndex = users.findIndex(u => u.email === user.email)
  if (foundIndex !== -1) {
    users[foundIndex] = user
  } else {
    users.push(user)
  }

  setUsers(users)
}

export function setUsers(users) {
  const config = getConfig()
  config.users = users
  setConfig(config)
}

function getConfig() {
  if (!configFileExists()) {
    return {}
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE_PATH))
}

function setConfig(config) {
  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config))
}

function configFileExists() {
  return fs.existsSync(CONFIG_FILE_PATH)
}

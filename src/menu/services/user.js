import fs from 'fs'
import path from 'path'
import os from 'os'

const CONFIG_FILE_PATH = path.join(os.homedir(), '.git-switch.json')

export function get() {
  return getConfig().users || []
}

export function add({ name, email, rsaKeyPath }) {
  const users = get()
  users.push({ name, email, rsaKeyPath })
  persist(users)
}

export function update(user) {
  // TODO: tomorrow, make this work so that users can update their email
  const users = get()
  const foundIndex = users.findIndex(u => u.email === user.email)
  if (foundIndex !== -1) {
    users[foundIndex] = user
  } else {
    users.push(user)
  }

  persist(users)
}

function persist(users) {
  const config = getConfig()
  config.users = users
  setConfig(config)
}

function getConfig() {
  if (!configFileExists())
    return {}

  return JSON.parse(fs.readFileSync(CONFIG_FILE_PATH))
}

function setConfig(config) {
  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2))
}

function configFileExists() {
  return fs.existsSync(CONFIG_FILE_PATH)
}

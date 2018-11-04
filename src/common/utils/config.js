import fs from 'fs'
import os from 'os'
import path from 'path'

const CONFIG_FILE = path.join(os.homedir(), '.git-switch', 'config.json')
const defaultConfig = {
  users: []
}

function configFileExists() {
  return fs.existsSync(CONFIG_FILE)
}

export function read() {
  return configFileExists()
    ? JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
    : defaultConfig
}

export function write(newConfig) {
  const existing = read()
  const config = {
    ...existing,
    ...newConfig
  }

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { encoding: 'utf-8', mode: 0o644 })
}

import fs from 'fs'
import os from 'os'
import path from 'path'

import { config } from '../utils'

export const SSH_CONFIG_PATH = path.join(os.homedir(), '.ssh', 'config')
const DEFAULT_HOST = 'github.com'

function getHost() {
  return config.read().host || DEFAULT_HOST
}

function getRegex(host) {
  const escapedHost = host.replace('.', '\\.')

  return new RegExp(`^(?<hostConfig>Host\\s${escapedHost}$[\\w\\s.]*\\s*IdentityFile\\s)(?<identityFile>.*)`, 'm')
}

function getRsaConfig(host, identityFile) {
  return `Host ${host}
\tIdentityFile ${identityFile}`
}

function writeToSshConfig(contents) {
  fs.writeFileSync(SSH_CONFIG_PATH, contents, { encoding: 'utf-8', mode: 0o644 })
}

export function rotateIdentityFile(identityFile) {
  if (!identityFile) {
    return
  }

  const host = getHost()
  const rsaConfig = getRsaConfig(host, identityFile)

  if (!fs.existsSync(SSH_CONFIG_PATH)) {
    writeToSshConfig(`${rsaConfig}\n`)
    return
  }

  const rsaRegex = getRegex(host)
  const existingContents = fs.readFileSync(SSH_CONFIG_PATH, 'utf-8')
  const match = rsaRegex.exec(existingContents)

  if (!match) {
    writeToSshConfig(`${existingContents ? `${existingContents}\n` : ''}${rsaConfig}\n`)
  } else if (match.groups.identityFile !== identityFile) {
    writeToSshConfig(existingContents.replace(rsaRegex, `$<hostConfig>${identityFile}`))
  }
}

import fs from 'fs'
import os from 'os'
import path from 'path'

import { config } from '../utils'

export const SSH_CONFIG_PATH = path.join(os.homedir(), '.ssh', 'config')
const DEFAULT_HOST = 'github.com'
let host = DEFAULT_HOST
let rsaRegex = new RegExp(/^(Host\sgithub\.com$[\w\s.]*\s*IdentityFile\s)(.*)/, 'm')
let defaultRsaConfig = `Host github.com
\tIdentityFile `

const REGEX_PATTERN = '^(Host\\s[host]$[\\w\\s.]*\\s*IdentityFile\\s)(.*)'
const RSA_CONFIG_PATTERN = `Host [host]
\tIdentityFile `

export function rotateIdentityFile(identityFile) {
  if (!identityFile) {
    return
  }

  updateRegexAndConfig()

  if (!fs.existsSync(SSH_CONFIG_PATH)) {
    writeToSshConfig(`${defaultRsaConfig}${identityFile}\n`)
    return
  }

  const existingContents = fs.readFileSync(SSH_CONFIG_PATH, 'utf-8')
  const match = rsaRegex.exec(existingContents)

  if (!match) {
    writeToSshConfig(`${existingContents ? `${existingContents}\n` : ''}${defaultRsaConfig}${identityFile}\n`)
  } else if (match[2] !== identityFile) {
    writeToSshConfig(existingContents.replace(rsaRegex, `$1${identityFile}`))
  }
}

function writeToSshConfig(contents) {
  fs.writeFileSync(SSH_CONFIG_PATH, contents, { encoding: 'utf-8', mode: 0o644 })
}

function updateRegexAndConfig() {
  const configuredHost = config.read().host || DEFAULT_HOST

  if (configuredHost === host)
    return

  host = configuredHost
  rsaRegex = new RegExp(REGEX_PATTERN.replace('[host]', host.replace('.', '\\.')), 'm')
  defaultRsaConfig = RSA_CONFIG_PATTERN.replace('[host]', host)
}

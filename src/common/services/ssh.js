import fs from 'fs'
import os from 'os'
import path from 'path'

export const SSH_CONFIG_PATH = path.join(os.homedir(), '.ssh', 'config')
const RSA_REGEX = new RegExp(/^(Host\sgithub\.com$[\w\s.]*\s*IdentityFile\s)(.*)/, 'm')
const DEFAULT_RSA_CONFIG = `Host github.com
\tIdentityFile `

export function rotateIdentityFile(identityFile) {
  if (!identityFile) {
    return
  }

  if (!fs.existsSync(SSH_CONFIG_PATH)) {
    writeToSshConfig(`${DEFAULT_RSA_CONFIG}${identityFile}\n`)
    return
  }

  const existingContents = fs.readFileSync(SSH_CONFIG_PATH, 'utf-8')
  const match = RSA_REGEX.exec(existingContents)

  if (!match) {
    writeToSshConfig(`${existingContents ? `${existingContents}\n` : ''}${DEFAULT_RSA_CONFIG}${identityFile}\n`)
  } else if (match[2] !== identityFile) {
    writeToSshConfig(existingContents.replace(RSA_REGEX, `$1${identityFile}`))
  }
}

function writeToSshConfig(contents) {
  fs.writeFileSync(SSH_CONFIG_PATH, contents, { encoding: 'utf-8', mode: 0o644 })
}

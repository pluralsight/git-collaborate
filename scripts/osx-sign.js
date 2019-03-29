const { signAsync } = require('electron-osx-sign')
const fs = require('fs-extra')
const os = require('os')
const path = require('path')

const { getPackageSrcDir, MAC_OS_PLATFORM, osNames, removePackageSrc } = require('./package-helper')

function checkMacPackageExistance() {
  const macRelease = getPackageSrcDir(osNames.macos)

  if (!fs.existsSync(macRelease)) {
    const errMessage = 'Error: No macos package is present'.concat(
      '\nPlease ensure that you have run: npm run package:all (or) npm run package:macos'
    )
    console.error(errMessage)
    process.exit(1)
  }
}

function runOsxSign() {
  console.log('Signing macos package using the darwin certificate specified in keychain.')
  const app = path.join(getPackageSrcDir(osNames.macos), 'git-switch.app')

  signAsync({ app, platform: MAC_OS_PLATFORM.toLowercase() }).then(() => {
    console.log(`Successfully signed macos package '${app}'`)
  }).catch(err => {
    console.error(`Error: ${err}`)
    console.warn('For more info about signing macos packages, please visit the README.')
    process.exit(1)
  })
}

function signOsxPackage() {
  checkMacPackageExistance()
  runOsxSign()
}

function nonMacWarning() {
  console.warn('Warning: The macos package may only be signed from a mac.')
  console.log('Any existing macos release will now be removed and not signed.')
  removePackageSrc(osNames.macos)
}

function execute() {
  os.type() === MAC_OS_PLATFORM
    ? signOsxPackage()
    : nonMacWarning()
}

execute()

/* eslint-disable no-console */

const archiver = require('archiver')
const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')

const PACKAGE_BASE_NAME = 'git-switch'

const OS_NAMES = {
  MAC_OS: 'macos',
  LINUX: 'linux',
  WINDOWS: 'windows'
}

const packageNames = {
  [OS_NAMES.MAC_OS]: `${PACKAGE_BASE_NAME}-darwin-x64`,
  [OS_NAMES.LINUX]: `${PACKAGE_BASE_NAME}-linux-x64`,
  [OS_NAMES.WINDOWS]: `${PACKAGE_BASE_NAME}-win32-x64`
}

function getPackageZipDir(targetOS) {
  return path.join(__dirname, '..', 'out', `${PACKAGE_BASE_NAME}-${targetOS}.zip`)
}

function getPackageSrcDir(targetOS) {
  return path.join(__dirname, '..', 'out', packageNames[targetOS])
}

function removePackageSrc(targetOS) {
  const sourceDir = getPackageSrcDir(targetOS)
  rimraf.sync(sourceDir)
}

function zipPackage(targetOS) {
  const zippedDir = getPackageZipDir(targetOS)
  const sourceDir = getPackageSrcDir(targetOS)

  const srcCodeExists = fs.existsSync(sourceDir)
  if (!srcCodeExists) {
    throw new Error('`npm run pack` must be run before zipping!')
  }

  const zippedPackage = fs.createWriteStream(zippedDir)
  const zip = archiver('zip', { zlib: { level: 9 } })

  zippedPackage.on('close', () => {
    console.log(`${targetOS} package: ${zip.pointer()} total bytes`)
    console.log(`Finished zipping ${PACKAGE_BASE_NAME}-${targetOS}.zip`)
    console.log(`Removing unzipped build: ${sourceDir}...`)
    removePackageSrc(targetOS)
  })

  zip.on('error', (err) => { throw err })
  zip.pipe(zippedPackage)
  zip.directory(sourceDir, false)
  zip.finalize()
}

function execute() {
  console.log('Starting zip of all OS packages...')

  zipPackage(OS_NAMES.MAC_OS)
  zipPackage(OS_NAMES.LINUX)
  zipPackage(OS_NAMES.WINDOWS)
}

execute()

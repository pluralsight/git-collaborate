const archiver = require('archiver')
const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')

const PACKAGE_BASE_NAME = 'git-collab'

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

function getFileSizeString(bytes) {
  const units = ['B', 'kB', 'MB', 'GB', 'TB']
  const kilobyte = 1024
  let unitIndex = 0

  while (bytes >= kilobyte && unitIndex < units.length) {
    bytes /= kilobyte
    unitIndex++
  }

  return `${unitIndex === 0 ? bytes : bytes.toFixed(2)} ${units[unitIndex]}`
}

function removePackageSrc(targetOS) {
  const sourceDir = getPackageSrcDir(targetOS)
  rimraf.sync(sourceDir)
}

function zipPackage(targetOS) {
  console.info(`Creating zip for '${targetOS}'...\n`)

  const zippedDir = getPackageZipDir(targetOS)
  const sourceDir = getPackageSrcDir(targetOS)

  const srcCodeExists = fs.existsSync(sourceDir)
  if (!srcCodeExists) {
    throw new Error(`'npm run package:${targetOS}' or 'npm run package:all' must be run before zipping!`)
  }

  const zipFile = fs.createWriteStream(zippedDir)
  const archive = archiver('zip', { zlib: { level: 9 } })

  archive.pipe(zipFile)
  archive.directory(sourceDir, false)
  archive.finalize()

  return new Promise((resolve, reject) => {
    archive.on('error', (err) => reject(err))

    zipFile.on('close', () => {
      const size = getFileSizeString(archive.pointer())
      console.info(`Created ${PACKAGE_BASE_NAME}-${targetOS}.zip (${size})`)

      console.info(`Removing unzipped build: ${sourceDir}...\n`)
      removePackageSrc(targetOS)

      resolve()
    })
  })
}

async function execute() {
  console.info('Starting zip of all OS packages...\n')
  await Promise.all(Object.values(OS_NAMES).map(zipPackage))
  console.info('Finished')
}

execute()

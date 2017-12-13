const archiver = require('archiver')
const fs = require('fs-extra')
const os = require('os')

const { getPackageSrcDir, getPackageZipDir, removePackageSrc } = require('./utils/package')

function zipPackage(operatingSystem) {
  const zippedDir = getPackageZipDir(operatingSystem)
  const sourceDir = getPackageSrcDir(operatingSystem)

  const srcCodeExists = fs.existsSync(sourceDir)
  const nonMacMessage = os.type() !== 'Darwin'

  if (!srcCodeExists)
    throw new Error('npm run build:packages must be run before zipping!')

  if (nonMacMessage) {
    removePackageSrc('macos')
    const nonMacLog = 'Warning: The macos package may only be signed from a mac.'.concat(
      '\nThe existing macos release will now be removed and will not be zipped.')
    console.log(nonMacLog)

    return
  }

  const zippedPackage = fs.createWriteStream(zippedDir)
  const zip = archiver('zip', { zlib: { level: 9 } })

  zippedPackage.on('close', () => {
    console.log(`${operatingSystem} package:`, zip.pointer() + ' total bytes')
    console.log(`Compression has completed for git-switch-${operatingSystem}.zip and the output file descriptor has closed.`)
    console.log(`Removing unzipped build:`, sourceDir)
    removePackageSrc(operatingSystem)
    console.log(`Finished zipping git-switch-${operatingSystem}.zip`)
  })

  zip.on('error', (err) => { throw err })
  zip.pipe(zippedPackage)
  zip.directory(sourceDir, false)
  zip.finalize()
}

function execute() {
  console.log('Starting zip of all OS packages...')
  zipPackage('macos')
  zipPackage('linux')
  zipPackage('windows')
}

execute()

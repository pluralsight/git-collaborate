const archiver = require('archiver')
const fs = require('fs-extra')
const os = require('os')

const { getPackageSrcDir, getPackageZipDir, removePackageSrc } = require('./utils/package')

function zipPackage(targetOS) {
  const zippedDir = getPackageZipDir(targetOS)
  const sourceDir = getPackageSrcDir(targetOS)

  const srcCodeExists = fs.existsSync(sourceDir)
  if (!srcCodeExists)
    throw new Error('npm run build:packages must be run before zipping!')

  const zippedPackage = fs.createWriteStream(zippedDir)
  const zip = archiver('zip', { zlib: { level: 9 } })

  zippedPackage.on('close', () => {
    console.log(`${targetOS} package:`, zip.pointer() + ' total bytes')
    console.log(`Compression has completed for git-switch-${targetOS}.zip and the output file descriptor has closed.`)
    console.log(`Removing unzipped build:`, sourceDir)
    removePackageSrc(targetOS)
    console.log(`Finished zipping git-switch-${targetOS}.zip`)
  })

  zip.on('error', (err) => { throw err })
  zip.pipe(zippedPackage)
  zip.directory(sourceDir, false)
  zip.finalize()
}

function zipMacPackage(targetOs) {
  const macOS = 'Darwin'
  const isMacHost = os.type() === macOS
  const sourceDir = getPackageSrcDir(targetOs)

  if (!isMacHost) {
    if (sourceDir) {
      console.warn('Warning: The macos package may only be signed from a mac.')
      console.log('Any existing macos release will now be removed and not zipped.')
      console.log(`Removing unzipped build:`, sourceDir)
      removePackageSrc('macos')
    }

    return
  }

  zipPackage(targetOs)
}

function execute() {
  console.log('Starting zip of all OS packages...')

  zipMacPackage('macos')
  zipPackage('linux')
  zipPackage('windows')
}

execute()

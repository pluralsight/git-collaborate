'use strict'

const childProcess = require('child_process')

function exec(command, options) {
  return new Promise((resolve, reject) => {
    childProcess.exec(command, (err, data) => {
      if (err && !options.ignoreError) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

module.exports = exec

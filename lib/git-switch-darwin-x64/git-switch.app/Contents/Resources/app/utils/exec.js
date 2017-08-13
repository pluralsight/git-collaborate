import proc from 'child_process'

export default function(command, options) {
  const { ignoreError, ...opts } = options || {}
  return new Promise((resolve, reject) => {
    proc.exec(command, opts, (err, data) => {
      if (err && !ignoreError) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

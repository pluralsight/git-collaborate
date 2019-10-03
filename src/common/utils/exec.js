import proc from 'child_process'

export function execute(command, options) {
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

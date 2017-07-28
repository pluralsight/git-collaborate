import childProcess from 'child_process'

export async function setUser(name, email) {
  await execute(`git config set user`)
}

async function execute(command, options) {
  return new Promise((resolve, reject) => {
    childProcess.exec(command, options, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

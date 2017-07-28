import childProcess from 'child_process'

export async function setAuthor(name, email) {
  await execute(`git config --global author.name "${name}"`)
  await execute(`git config --global author.email "${email}"`)
}

export async function setCommitters(name, email) {
  await execute(`git config --global user.name "${name}"`)
  await execute(`git config --global user.email "${email}"`)
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

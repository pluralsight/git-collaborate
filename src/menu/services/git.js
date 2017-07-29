import childProcess from 'child_process'

export async function setAuthor(name, email) {
  await execute(`git config --global author.name "${name}"`)
  await execute(`git config --global author.email "${email}"`)
}

export async function setCommitter(name, email) {
  await execute(`git config --global user.name "${name}"`)
  await execute(`git config --global user.email "${email}"`)
}

export function getAuthorAndCommitter(users) {
  const activeUsers = users.filter(u => u.active)
  if (!activeUsers.length)
    return getDefaultAuthorAndCommitter()

  const author = activeUsers.length === 1
    ? activeUsers[0]
    : activeUsers.shift()

  return {
    author: {
      name: author.name,
      email: author.email
    },
    committer: {
      name: activeUsers.map(u => u.name).join(' & '),
      email: activeUsers.map(u => u.email).join(', ')
    }
  }
}

function getDefaultAuthorAndCommitter() {
  return {
    author: { name: '', email: '' },
    committer: { name: '', email: '' }
  }
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

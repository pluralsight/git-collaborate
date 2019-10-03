import { getLongestString } from '../../../common/utils/string'
import { get as getUsers } from '../../../common/services/user'

export const command = 'list'
export const describe = 'List users'

export const builder = yargs =>
  yargs
    .usage('Usage:\n  git-switch users list')
    .version(false)

const getColumn = (users, header, key) => {
  const values = users.map(u => u[key])

  return {
    header,
    width: getLongestString([header, ...values]),
    values
  }
}

const getField = (value, minWidth, paddingChar = ' ', startWidth = 0) => {
  return value.padStart(startWidth, paddingChar).padEnd(minWidth, paddingChar)
}

const getHeaderLines = columns => {
  const { id, name, email, rsaKeyPath, active } = columns

  const headerLine = `| \
${getField(id.header, id.width)} | \
${getField(name.header, name.width)} | \
${getField(email.header, email.width)} | \
${getField(rsaKeyPath.header, rsaKeyPath.width)} | \
${getField(active.header, active.width)} |`
  const dividerLine = `|-\
${getField('', id.width, '-')}-|-\
${getField('', name.width, '-')}-|-\
${getField('', email.width, '-')}-|-\
${getField('', rsaKeyPath.width, '-')}-|-\
${getField('', active.width, '-')}-|`

  return [headerLine, dividerLine]
}

const getUserLines = columns => {
  const { id, name, email, rsaKeyPath, active } = columns
  const rows = id.values.length

  return Array(rows).fill(null).map((_, i) => {
    return `| \
${getField(id.values[i], id.width)} | \
${getField(name.values[i], name.width)} | \
${getField(email.values[i], email.width)} | \
${getField(rsaKeyPath.values[i], rsaKeyPath.width)} | \
${getField(active.values[i] ? '✓' : '', active.width, ' ', 5)} |`
  })
}

export const handler = () => {
  const users = getUsers()

  const columns = {
    id: getColumn(users, 'ID', 'id'),
    name: getColumn(users, 'Name', 'name'),
    email: getColumn(users, 'Email', 'email'),
    rsaKeyPath: getColumn(users, 'RSA Key', 'rsaKeyPath'),
    active: getColumn(users, 'Is Active', 'active')
  }
  const lines = [
    ...getHeaderLines(columns),
    ...getUserLines(columns)
  ]

  lines.forEach(l => console.log(l))
}

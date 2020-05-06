import { userService } from '../../../common/services'
import { getBoarderLine, getColumn, getField, getHeaderLines, logger } from '../../utils'

export const command = ['list', 'ls']
export const describe = 'List users'

export const builder = (yargs) =>
  yargs
    .usage('Usage:\n  git-switch users list')
    .options({
      isActive: {
        alias: 'a',
        describe: 'List only active users',
        boolean: true,
        default: false
      }
    })
    .version(false)

const getUserLines = (columns) => {
  const [id, name, email, rsaKeyPath, sshHost, active] = columns
  const rows = id.values.length

  return Array(rows).fill(null).map((_, i) =>
    `| \
${getField({ value: id.values[i], minWidth: id.width })} | \
${getField({ value: name.values[i], minWidth: name.width })} | \
${getField({ value: email.values[i], minWidth: email.width })} | \
${getField({ value: rsaKeyPath.values[i], minWidth: rsaKeyPath.width })} | \
${getField({ value: sshHost.values[i], minWidth: sshHost.width })} | \
${getField({ value: active.values[i] ? '✓' : '', minWidth: active.width, startWidth: 5 })} |`)
}

export const handler = (args) => {
  const { isActive, doWork } = args

  if (!doWork) return

  let users = userService.get()
  if (isActive) {
    users = users.filter((u) => u.active)
  }

  const columns = [
    getColumn({ data: users, header: 'ID', key: 'id' }),
    getColumn({ data: users, header: 'Name', key: 'name' }),
    getColumn({ data: users, header: 'Email', key: 'email' }),
    getColumn({ data: users, header: 'RSA Key', key: 'rsaKeyPath' }),
    getColumn({ data: users, header: 'SSH Host', key: 'sshHost' }),
    getColumn({ data: users, header: 'Is Active', key: 'active' })
  ]
  const lines = [
    ...getHeaderLines(columns),
    ...getUserLines(columns),
    getBoarderLine(columns)
  ]

  lines.forEach((l) => logger.info(l))
}

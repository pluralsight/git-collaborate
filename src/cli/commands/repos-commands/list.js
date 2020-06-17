import { repoService } from '../../../common/services'
import { getBoarderLine, getColumn, getField, getHeaderLines, logger } from '../../utils'

export const command = ['list', 'ls']
export const describe = 'List repositories'

export const builder = (yargs) =>
  yargs
    .usage('Usage:\n  git-collab repos list')
    .version(false)

const getRepoLines = (columns) => {
  const [name, path, isValid] = columns
  const rows = name.values.length

  return Array(rows).fill(null).map((_, i) =>
    `| \
${getField({ value: name.values[i], minWidth: name.width })} | \
${getField({ value: path.values[i], minWidth: path.width })} | \
${getField({ value: isValid.values[i] ? '✓' : '', minWidth: isValid.width, startWidth: 5 })} |`)
}

export const handler = (args) => {
  if (!args.doWork) return

  const repos = repoService.get()

  const columns = [
    getColumn({ data: repos, header: 'Basename', key: 'name' }),
    getColumn({ data: repos, header: 'Path', key: 'path' }),
    getColumn({ data: repos, header: 'Is Valid', key: 'isValid' })
  ]
  const lines = [
    ...getHeaderLines(columns),
    ...getRepoLines(columns),
    getBoarderLine(columns)
  ]

  lines.forEach((l) => logger.info(l))
}

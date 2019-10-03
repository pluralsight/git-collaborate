import * as logger from '../../../common/utils/logger'
import { get as getRepos } from '../../../common/services/repo'
import { getLongestString } from '../../../common/utils/string'

export const command = 'list'
export const describe = 'List repositories'

export const builder = yargs =>
  yargs
    .usage('Usage:\n  git-switch repos list')
    .version(false)

const getColumn = (repos, header, key) => {
  const values = repos.map(u => u[key])

  return {
    header,
    width: getLongestString([header, ...values]),
    values
  }
}

const getField = (value, minWidth, paddingChar = ' ', startWidth = 0) => {
  return value.padStart(startWidth, paddingChar).padEnd(minWidth, paddingChar)
}

const getBoarderLines = columns => {
  const { name, path, isValid } = columns

  return [` -\
${getField('', name.width, '-')}---\
${getField('', path.width, '-')}---\
${getField('', isValid.width, '-')}- `
  ]
}

const getHeaderLines = columns => {
  const { name, path, isValid } = columns

  const topLine = getBoarderLines(columns)
  const headerLine = `| \
${getField(name.header, name.width)} | \
${getField(path.header, path.width)} | \
${getField(isValid.header, isValid.width)} |`
  const dividerLine = `|-\
${getField('', name.width, '-')}-|-\
${getField('', path.width, '-')}-|-\
${getField('', isValid.width, '-')}-|`

  return [...topLine, headerLine, dividerLine]
}

const getUserLines = columns => {
  const { name, path, isValid } = columns
  const rows = name.values.length

  return Array(rows).fill(null).map((_, i) => {
    return `| \
${getField(name.values[i], name.width)} | \
${getField(path.values[i], path.width)} | \
${getField(isValid.values[i] ? '✓' : '', isValid.width, ' ', 5)} |`
  })
}

export const handler = args => {
  if (!args.doWork) return

  const repos = getRepos()

  const columns = {
    name: getColumn(repos, 'Basename', 'name'),
    path: getColumn(repos, 'Path', 'path'),
    isValid: getColumn(repos, 'Is Valid', 'isValid')
  }
  const lines = [
    ...getHeaderLines(columns),
    ...getUserLines(columns),
    ...getBoarderLines(columns)
  ]

  lines.forEach(l => logger.info(l))
}

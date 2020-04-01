import { getLongestString } from '../../common/utils'

export const getColumn = ({ data, header, key }) => {
  const values = data.map(d => d[key])

  return {
    header,
    width: getLongestString([header, ...values]),
    values
  }
}

export const getField = overrides => {
  const { minWidth, paddingChar, startWidth, value } = {
    minWidth: 0,
    paddingChar: ' ',
    startWidth: 0,
    value: '',
    ...overrides
  }

  return value.padStart(startWidth, paddingChar).padEnd(minWidth, paddingChar)
}

export const getBoarderLine = columns =>
  columns.reduce((line, c, i) =>
    `${line}${getField({ minWidth: c.width, paddingChar: '-' })}${i < columns.length - 1 ? '---' : '-'}`
  , ' -')

export const getHeaderLines = columns => {
  const headerLine = columns.reduce((line, c, i) =>
    `${line}${getField({ value: c.header, minWidth: c.width })}${i < columns.length - 1 ? ' | ' : ' |'}`
  , '| ')

  const dividerLine = columns.reduce((line, c, i) =>
    `${line}${getField({ minWidth: c.width, paddingChar: '-' })}${i < columns.length - 1 ? '-|-' : '-|'}`
  , '|-')

  return [getBoarderLine(columns), headerLine, dividerLine]
}

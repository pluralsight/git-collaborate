import capitalize from 'lodash.capitalize'

export const formatActiveUserFirstNames = (users) => {
  const activeUserFirstNames = users.filter((u) => u.active).map((u) => u.name.split(' ')[0])

  return activeUserFirstNames.length < 3
    ? activeUserFirstNames.join(' and ')
    : `${activeUserFirstNames.slice(0, -1).join(', ')} and ${activeUserFirstNames.slice(-1)}`
}

export const getNotificationLabel = (activeUserCount, shouldCapitalize = false) => {
  const label = activeUserCount < 2 ? 'author' : (activeUserCount === 2 ? 'pair' : 'mob')

  return shouldCapitalize ? capitalize(label) : label
}

export const getLongestString = (strings) => {
  return strings.reduce((longest, string) => {
    if (string.length > longest) {
      longest = string.length
    }

    return longest
  }, 0)
}

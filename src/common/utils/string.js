export function formatActiveUserFirstNames(users) {
  const activeUserFirstNames = users.filter(u => u.active).map(u => u.name.split(' ')[0])

  return activeUserFirstNames.length < 3
    ? activeUserFirstNames.join(' and ')
    : `${activeUserFirstNames.slice(0, -1).join(', ')} and ${activeUserFirstNames.slice(-1)}`
}

export function getNotificationLabel(userCount, shouldCapitalize = false) {
  const label = userCount < 2 ? 'author' : (userCount === 2 ? 'pair' : 'mob')

  return shouldCapitalize ? capitalize(label) : label
}

function capitalize(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1)
}

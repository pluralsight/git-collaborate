import uuid from 'uuid/v4'

import * as config from '../utils/config'
import * as gitService from './git'
import * as sshService from './ssh'

export function get() {
  return config.read().users || []
}

function persist(users) {
  config.write({ users })

  return users
}

function updateExternalServices(users) {
  gitService.updateAuthorAndCoAuthors(users)
  sshService.rotateIdentityFile(users[0].rsaKeyPath)
}

export function add({ name, email, rsaKeyPath }) {
  const users = get()
  const id = uuid()
  users.push({ id, name, email, rsaKeyPath, active: true })

  const updated = persist(users)
  updateExternalServices(users)

  return updated
}

export function update(user) {
  const users = get()
  const foundIndex = users.findIndex(u => u.id === user.id)
  if (foundIndex !== -1) {
    users[foundIndex] = user
  } else {
    users.push(user)
  }

  const updated = persist(users)
  updateExternalServices(users)

  return updated
}

export function remove(id) {
  const users = get()
  const foundIndex = users.findIndex(u => u.id === id)
  if (foundIndex === -1) return

  users.splice(foundIndex, 1)

  const updated = persist(users)
  updateExternalServices(users)

  return updated
}

export function rotate() {
  const users = get()
  const activeUsers = users.filter(u => u.active)
  if (!activeUsers.length || activeUsers.length === 1) return users

  const inactiveUsers = users.filter(u => !u.active)
  const updatedUsers = [
    ...activeUsers.slice(1),
    activeUsers[0],
    ...inactiveUsers
  ]

  const updated = persist(updatedUsers)
  updateExternalServices(updatedUsers)

  return updated
}

export function toggleActive(id) {
  const users = get()
  const user = users.find(u => u.id === id)
  if (!user) return users

  const activeUsers = users.filter(u => u.active && u.id !== id)
  const inactiveUsers = users.filter(u => !u.active && u.id !== id)

  user.active = !user.active
  const updatedUsers = [
    ...activeUsers,
    user,
    ...inactiveUsers
  ]

  const updated = persist(updatedUsers)
  updateExternalServices(updatedUsers)

  return updated
}

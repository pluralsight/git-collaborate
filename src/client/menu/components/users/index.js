import { remote } from 'electron'
import md5 from 'md5'
import { array, func, number } from 'prop-types'
import React from 'react'

import { RefreshButton } from '../'
import * as api from '../../../api'
import { ClearIcon, MenuIcon } from '../../icons'
import { userType } from './types'

import css from './index.css'

function User(props) {
  const { index, onEditUser, setUsers, user } = props

  const handleToggleActiveUser = (user) => (evt) => {
    if (!evt.target.closest('button')) {
      setUsers(api.toggleUserActive(user.id))
    }
  }

  const handleRemoveUser = (userId) => {
    setUsers(api.removeUser(userId))
  }

  const handleShowUserActionsMenu = (user) => () => {
    remote.Menu.buildFromTemplate([
      { label: 'Edit', click: () => onEditUser(user) },
      { label: 'Delete', click: () => handleRemoveUser(user.id) }
    ]).popup()
  }

  const photoUrl = `https://www.gravatar.com/avatar/${md5(user.email.trim().toLowerCase())}?d=mm&s=28`
  const role = !user.active
    ? ''
    : index === 0
      ? 'Author'
      : 'Co-Author'

  return (
    <li
      className={`${css.user}${user.active ? ` ${css.active}` : ` ${css.inactive}`}`}
      onClick={handleToggleActiveUser(user)}
    >
      <div className={css.avatar}>
        <div className={css.avatarImage} style={{ backgroundImage: `url("${photoUrl}")` }} />
        <div className={css.deactivateButton}>
          <ClearIcon className={`${css.deactivateIcon} ${css.buttonIcon}`} />
        </div>
        <div className={css.activateButton}>
          <ClearIcon className={`${css.activateIcon} ${css.buttonIcon}`} />
        </div>
      </div>
      <div className={css.userInfo}>
        <div className={css.name}>{user.name}</div>
        {role && <div className={css.role}>{role}</div>}
      </div>
      <button onClick={handleShowUserActionsMenu(user)} className={css.userMenuButton}>
        <MenuIcon class={`${css.userMenuIcon} ${css.buttonIcon}`} />
      </button>
    </li>
  )
}

User.propTypes = {
  index: number,
  onEditUser: func.isRequired,
  setUsers: func.isRequired,
  user: userType
}

function EmptyState() {
  return (
    <div className={css.emptyMessage}>
      No users yet
    </div>
  )
}

function ActiveUsers(props) {
  const { onEditUser, setUsers, users } = props

  const handleRotateUsers = () => setUsers(api.rotateActiveUsers())

  return users.length
    ? (
      <>
        <div className={css.usersListHeader}>
          <span>Active</span>
          <div className={css.buttons}>
            <RefreshButton onClick={handleRotateUsers} disabled={users.length === 1} />
          </div>
        </div>
        <ul className={css.usersList}>
          {users.map((user, i) => (
            <User
              index={i}
              key={user.id}
              onEditUser={onEditUser}
              setUsers={setUsers}
              user={user}
            />
          ))}
        </ul>
      </>
    )
    : null
}

function InactiveUsers(props) {
  const { onEditUser, setUsers, users } = props

  return users.length
    ? (
      <>
        <div className={css.usersListHeader}>Inactive</div>
        <ul className={css.usersList}>
          {users.map((user, i) => (
            <User
              index={i}
              key={user.id}
              onEditUser={onEditUser}
              setUsers={setUsers}
              user={user}
            />
          ))}
        </ul>
      </>
    )
    : null
}

export function Users(props) {
  const { users, ...rest } = props

  const activeUsers = users.filter((u) => u.active)
  const inactiveUsers = users.filter((u) => !u.active)

  return (
    <div className={css.container}>
      <ActiveUsers {...rest} users={activeUsers} />
      <InactiveUsers {...rest} users={inactiveUsers} />
      {
        !users.length
          ? <EmptyState />
          : null
      }
    </div>
  )
}

Users.propTypes = {
  onEditUser: func.isRequired,
  setUsers: func.isRequired,
  users: array.isRequired
}

import { remote } from 'electron'
import md5 from 'md5'
import { array, func } from 'prop-types'
import React from 'react'

import { Button } from '../'
import { ClearIcon, MoreIcon, RotateIcon } from '../../icons'

import css from './index.css'

export class Users extends React.Component {
  static propTypes = {
    onEditUser: func.isRequired,
    onUserActiveToggled: func.isRequired,
    onUserRemoved: func.isRequired,
    onUsersRotated: func.isRequired,
    users: array.isRequired
  }

  handleRotateUsers = () => {
    this.props.onUsersRotated()
  }
  handleToggleActiveUser = user => evt => {
    if (!evt.target.closest('button'))
      this.props.onUserActiveToggled(user.id)
  }
  handleRemoveUser = userId => {
    this.props.onUserRemoved(userId)
  }
  handleShowUserActionsMenu = user => () => {
    remote.Menu.buildFromTemplate([
      { label: 'Edit', click: () => this.props.onEditUser(user) },
      { label: 'Delete', click: () => this.handleRemoveUser(user.id) }
    ]).popup()
  }

  renderUser = (user, index) => {
    const photoUrl = `https://www.gravatar.com/avatar/${md5(user.email.trim().toLowerCase())}?d=mm&s=28`
    const role = user.active
      ? index === 0 ? 'Author' : 'Co-Author'
      : ''

    return (
      <li className={`${css.user} ${user.active ? css.active : css.inactive}`} key={user.id} onClick={this.handleToggleActiveUser(user)}>
        <div className={css.avatar}>
          <div className={css.avatarImage} style={{ backgroundImage: `url("${photoUrl}")` }} />
          <div className={css.deactivateIcon}><ClearIcon className={`${css.deactivateIconIcon} ${css.buttonIcon}`} /></div>
          <div className={css.activateIcon}><ClearIcon className={`${css.activateIconIcon} ${css.buttonIcon}`} /></div>
        </div>
        <div className={css.userInfo}>
          <div className={css.name}>{user.name}</div>
          {role && <div className={css.role}>{role}</div>}
        </div>
        <button onClick={this.handleShowUserActionsMenu(user)} className={css.userMenuButton}>
          <MoreIcon />
        </button>
      </li>
    )
  }

  renderEmptyMessage = () => {
    if (this.props.users.length) return

    return (
      <div className={css.emptyMessage}>
        No users yet
      </div>
    )
  }
  renderActiveUsers = () => {
    const activeUsers = this.props.users.filter(u => u.active)
    if (!activeUsers.length) return

    return (
      <div>
        <div className={css.usersListHeader}>
          <span>Active</span>
          <div className={css.buttons}>
            <Button onClick={this.handleRotateUsers} disabled={activeUsers.length === 1}>
              <RotateIcon className={css.buttonIcon} />
            </Button>
          </div>
        </div>
        <ul className={css.usersList}>
          {activeUsers.map(this.renderUser)}
        </ul>
      </div>
    )
  }
  renderInactiveUsers = () => {
    const inactiveUsers = this.props.users.filter(u => !u.active)
    if (!inactiveUsers.length) return

    return (
      <div>
        <div className={css.usersListHeader}>Inactive</div>
        <ul className={css.usersList}>
          {inactiveUsers.map(this.renderUser)}
        </ul>
      </div>
    )
  }
  renderUserLists = () => {
    if (this.props.users.length) {
      return (
        <div>
          {this.renderActiveUsers()}
          {this.renderInactiveUsers()}
        </div>
      )
    }
  }
  render() {
    return (
      <div>
        <div className={css.container}>
          {this.renderEmptyMessage()}
          {this.renderUserLists()}
        </div>
      </div>
    )
  }
}

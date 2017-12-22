import React from 'react'
import CSSModules from 'react-css-modules'
import md5 from 'md5'

import { array, func } from 'prop-types'

import Button from '../components/button'
import { ClearIcon, MoreIcon, RotateIcon } from '../icons'

import css from './index.css'
import { remote } from 'electron'

@CSSModules(css)
export default class Users extends React.Component {
  static propTypes = {
    onAddUser: func.isRequired,
    onEditUser: func.isRequired,
    onActiveUsersCleared: func.isRequired,
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
  handleAddUser = newUser => {
    this.props.onAddUser(newUser)
  }
  handleUpdateUser = user => {
    this.toggleUserActions(user.id)
  }
  handleRemoveUser = userId => {
    this.props.onUserRemoved(userId)
  }
  handleClearActiveUsers = () => {
    this.props.onActiveUsersCleared()
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
      ? index === 0 ? 'Author' : 'Committer'
      : ''

    return (
      <li styleName="user" key={user.id} onClick={this.handleToggleActiveUser(user)}>
        <div styleName="avatar" style={{ backgroundImage: `url("${photoUrl}")` }} />
        <div styleName="user-info">
          <div styleName="name">{user.name}</div>
          {role && <div styleName="role">{role}</div>}
        </div>
        <button onClick={this.handleShowUserActionsMenu(user)} styleName="user-menu-button">
          <MoreIcon />
        </button>
      </li>
    )
  }

  renderEmptyMessage = () => {
    if (this.props.users.length) return

    return (
      <div styleName="empty-message">
        No users yet
      </div>
    )
  }
  renderActiveUsers = () => {
    const activeUsers = this.props.users.filter(u => u.active)
    if (!activeUsers.length) return

    return (
      <div>
        <div styleName="users-list-header">
          <span>Active</span>
          <div styleName="buttons">
            <Button onClick={this.handleRotateUsers} disabled={activeUsers.length === 1}><RotateIcon /></Button>
            <Button onClick={this.handleClearActiveUsers}><ClearIcon /></Button>
          </div>
        </div>
        <ul styleName="users-list">
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
        <div styleName="users-list-header">Inactive</div>
        <ul styleName="users-list">
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
        <div styleName="container">
          {this.renderEmptyMessage()}
          {this.renderUserLists()}
        </div>
      </div>
    )
  }
}

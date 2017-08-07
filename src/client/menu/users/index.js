import React from 'react'
import CSSModules from 'react-css-modules'

import { array, func } from 'prop-types'

import AddButton from './components/add-button'
import Button from '../components/button'
import DeleteButton from '../components/delete-button'
import EditButton from './components/edit-button'
import { ClearIcon, MoreIcon, RotateIcon } from '../icons'

import css from './index.css'

@CSSModules(css)
export default class Users extends React.Component {
  static propTypes = {
    onActiveUsersCleared: func.isRequired,
    onUserActiveToggled: func.isRequired,
    onUserAdded: func.isRequired,
    onUserRemoved: func.isRequired,
    onUserUpdated: func.isRequired,
    onUsersRotated: func.isRequired,
    users: array.isRequired
  }
  constructor(props) {
    super(props)
    this.state = { showUserActions: {} }
  }

  setShowUserActions(users) {
    const showUserActions = {}
    users.forEach(u => { showUserActions[u.id] = false })
    this.setState({ showUserActions })
  }

  componentDidMount() {
    this.setShowUserActions(this.props.users)
  }

  handleRotateUsers = async () => {
    this.props.onUsersRotated()
  }
  handleToggleActiveUser = user => async () => {
    this.props.onUserActiveToggled(user.id)
  }
  handleAddUser = async newUser => {
    this.props.onUserAdded(newUser)
  }
  handleUpdateUser = async user => {
    this.toggleUserActions(user.id)
    this.props.onUserUpdated(user)
  }
  handleRemoveUser = async userId => {
    this.props.onUserRemoved(userId)
  }
  handleClearActiveUsers = async () => {
    this.props.onActiveUsersCleared()
  }

  toggleUserActions = userId => () => {
    const showUserActions = {
      ...this.state.showUserActions,
      [userId]: !this.state.showUserActions[userId]
    }
    this.setState({ showUserActions })
  }

  renderUserActions = user => {
    const showUserActions = this.state.showUserActions[user.id]
    return showUserActions
      ? (
        <div>
          <div styleName="user-actions-container">
            <EditButton
              onEditUser={this.handleUpdateUser}
              onClose={this.toggleUserActions(user.id)}
              user={user} />
            <div styleName="back-button-container">
              <Button onClick={this.toggleUserActions(user.id)}>Back</Button>
            </div>
            <DeleteButton onRemove={this.handleRemoveUser} idToRemove={user.id} />
          </div>
        </div>
      ) : (
        <div>
          <MoreIcon onClick={this.toggleUserActions(user.id)} />
        </div>
      )
  }

  renderUser = (user, index) => {
    const role = user.active
      ? index === 0 ? 'Author' : 'Committer'
      : ''

    return (
      <li styleName="user" key={user.id}>
        <div>
          <input type="checkbox" styleName="active" checked={user.active} onChange={this.handleToggleActiveUser(user)} />
        </div>
        <div styleName="user-info">
          <div styleName="name">{user.name}</div>
          {role && <div styleName="role">{role}</div>}
        </div>
        {this.renderUserActions(user)}
      </li>
    )
  }

  render() {
    const activeUsers = this.props.users.filter(u => u.active)
    const inactiveUsers = this.props.users.filter(u => !u.active)

    return (
      <div>
        <div styleName="container">
          <div styleName="users-list-header">
            <span>Active</span>
            <div styleName="buttons">
              <Button onClick={this.handleRotateUsers}><RotateIcon /></Button>
              <Button onClick={this.handleClearActiveUsers}><ClearIcon /></Button>
            </div>
          </div>
          <ul styleName="users-list">
            {activeUsers.map(this.renderUser)}
          </ul>
          <div styleName="users-list-header">Inactive</div>
          <ul styleName="users-list">
            {inactiveUsers.map(this.renderUser)}
          </ul>
        </div>
        <AddButton onAddUser={this.handleAddUser} />
      </div>
    )
  }
}

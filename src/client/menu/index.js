import CSSModules from 'react-css-modules'
import React from 'react'

import AddButton from './components/add-button'
import Button from './components/button'
import EditButton from './components/edit-button'
import DeleteButton from './components/delete-button'
import { ClearIcon, GitIcon, RotateIcon } from './icons'
import css from './index.css'
import * as gitService from '../services/git'
import * as userService from '../services/user'

@CSSModules(css)
export default class Menu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      currentCommitter: '',
      users: [],
      showAddForm: false
    }
  }
  componentDidMount() {
    this.setState({ users: userService.get() })
  }

  handleGitUserChanges = async () => {
    const { author, committer } = gitService.getAuthorAndCommitter(userService.get())

    await gitService.setAuthor(author.name, author.email)
    await gitService.setCommitter(committer.name, committer.email)
  }
  handleRotateUsers = async () => {
    const updatedUsers = userService.rotate()
    this.setState({ users: updatedUsers })
    await this.handleGitUserChanges()
  }
  handleUserClick = user => async () => {
    const users = userService.toggleActive(user.id)
    this.setState({ users })
    await this.handleGitUserChanges()
  }
  handleAddUser = async newUser => {
    const users = userService.add(newUser)
    this.setState({ users })
    await this.handleGitUserChanges()
  }
  handleEditUser = async user => {
    const users = userService.update(user)
    this.setState({ users })
    await this.handleGitUserChanges()
  }
  handleRemoveUser = async userId => {
    const users = userService.remove(userId)
    this.setState({ users })
    await this.handleGitUserChanges()
  }
  handleClearActiveUsers = async () => {
    const users = userService.clearActive()
    this.setState({ users })
    await this.handleGitUserChanges()
  }

  renderUser = (user, index) => {
    const role = user.active
      ? index === 0 ? 'Author' : 'Committer'
      : ''
    return (
      <li styleName="user" key={user.id}>
        <div>
          <input type="checkbox" styleName="active" checked={user.active} onChange={this.handleUserClick(user)} />
        </div>
        <div styleName="user-info">
          <div styleName="name">{user.name}</div>
          {role && <div styleName="role">{role}</div>}
        </div>
        <div styleName="user-actions-container">
          <EditButton onEditUser={this.handleEditUser} user={user} />
          <DeleteButton onRemove={this.handleRemoveUser} userToRemove={user.id} />
        </div>
      </li>
    )
  }
  render() {
    const activeUsers = this.state.users.filter(u => u.active)
    const inactiveUsers = this.state.users.filter(u => !u.active)

    return (
      <div styleName="container">
        <div styleName="header"><GitIcon /><span styleName="header-title">switch</span></div>
        <div styleName="content">
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

        <div styleName="footer" />
      </div>
    )
  }
}

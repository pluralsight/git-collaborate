import CSSModules from 'react-css-modules'
import React from 'react'

import AddButton from './components/add-button'
import Button from './components/button'
import EditButton from './components/edit-button/index'
import css from './menu.css'
import * as gitService from './services/git'
import * as userService from './services/user'

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
    const committers = userService.get().filter(u => u.active)
    if (!committers.length) return

    const author = committers.length === 1
      ? committers[0]
      : committers.shift()

    await gitService.setAuthor(author.name, author.email)
    await gitService.setCommitters(committers.map(c => c.name).join(' & '), committers.map(c => c.email).join(', '))
  }
  handleRotateUsers = async () => {
    const updatedUsers = userService.rotate()
    this.setState({ users: updatedUsers })
    await this.handleGitUserChanges()
  }
  handleUserClick = user => async () => {
    const users = userService.toggleActive(user.email)
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
      <li styleName="user" key={user.email}>
        <div>
          <input type="checkbox" styleName="active" checked={user.active} onChange={this.handleUserClick(user)} />
        </div>
        <div styleName="user-info">
          <div styleName="name">{user.name}</div>
          {role && <div styleName="role">{role}</div>}
        </div>
        <div>
          <EditButton onEditUser={this.handleEditUser} user={user} />
        </div>
      </li>
    )
  }
  render() {
    const activeUsers = this.state.users.filter(u => u.active)
    const inactiveUsers = this.state.users.filter(u => !u.active)
    return (
      <div styleName="container">
        <div styleName="header">Git Switch</div>

        <div styleName="content">
          <div styleName="users-list-header">
            <span>Active</span>
            <div styleName="buttons">
              <Button onClick={this.handleRotateUsers}>
                <svg styleName="button-icon" fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z" /><path d="M0 0h24v24H0z" fill="none" /></svg>
              </Button>
              <Button onClick={this.handleClearActiveUsers}>
                <svg styleName="button-icon" fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /><path d="M0 0h24v24H0z" fill="none" /></svg>
              </Button>
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

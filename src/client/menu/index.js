import React from 'react'
import CSSModules from 'react-css-modules'
import { remote } from 'electron'

import Button from './components/button'
import * as gitService from '../services/git'
import { GitIcon, MenuIcon } from './icons'
import Repositories from './repositories'
import * as repoService from '../services/repo'
import * as userService from '../services/user'
import Users from './users'

import css from './index.css'

const moreMenu = remote.Menu.buildFromTemplate([
  { label: 'Quit Git Switch Electron', click: () => remote.app.quit() }
])

@CSSModules(css)
export default class Menu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      users: [],
      repos: [],
      showUserActions: {},
      showRepositories: false
    }
  }

  setShowUserActions(users) {
    const showUserActions = {}
    users.forEach(u => { showUserActions[u.id] = false })
    this.setState({ showUserActions })
  }

  componentDidMount() {
    const users = userService.get()
    const repos = repoService.get()
    this.setState({ users, repos })

    this.setShowUserActions(users)
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
  handleClearActiveUsers = async () => {
    const users = userService.clearActive()
    this.setState({ users })
    await this.handleGitUserChanges()
  }
  handleToggleActiveUser = async userId => {
    const users = userService.toggleActive(userId)
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
  handleAddRepo = path => {
    const repos = repoService.add(path)
    this.setState({ repos })
  }
  handleRemoveRepo = path => {
    const repos = repoService.remove(path)
    this.setState({ repos })
  }
  handleMenuButtonClick = () => {
    moreMenu.popup()
  }

  toggleRepositories = () => {
    this.setState({ showRepositories: !this.state.showRepositories })
  }

  renderContent = () => {
    const showRepositories = this.state.showRepositories

    return showRepositories
      ? (
        <Repositories
          repos={this.state.repos}
          onRepoAdded={this.handleAddRepo}
          onRepoRemoved={this.handleRemoveRepo} />
      ) : (
        <Users
          users={this.state.users}
          onActiveUsersCleared={this.handleClearActiveUsers}
          onUserActiveToggled={this.handleToggleActiveUser}
          onUserAdded={this.handleAddUser}
          onUserRemoved={this.handleRemoveUser}
          onUserUpdated={this.handleEditUser}
          onUsersRotated={this.handleRotateUsers} />
      )
  }
  render() {
    return (
      <div styleName="container">
        <div styleName="header">
          <GitIcon /><span styleName="header-title">switch</span>
          <div styleName="menu-button-container">
            <button styleName="menu-button" onClick={this.handleMenuButtonClick}><MenuIcon /></button>
          </div>
        </div>
        {this.renderContent()}
        <div styleName="footer">
          <Button onClick={this.toggleRepositories}>{this.state.showRepositories ? 'Users' : 'Repos'}</Button>
        </div>
      </div>
    )
  }
}

import React from 'react'
import CSSModules from 'react-css-modules'
import { remote, ipcRenderer } from 'electron'

import Button from './components/button'
import * as gitService from '../services/git'
import { GitIcon, MenuIcon } from './icons'
import Repositories from './repositories'
import * as repoService from '../services/repo'
import * as userService from '../services/user'
import Users from './users'
import UserForm from './users/components/user-form'

import css from './index.css'

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
    this.setState({
      users,
      repos,
      showRepositories: !repos.length
    })

    this.setShowUserActions(users)

    ipcRenderer.on('users-updated', this.handleUsersUpdated)
  }

  componentWillUnmount() {
    ipcRenderer.removeListener('users-updated', this.handleUsersUpdated)
  }

  handleUsersUpdated = (event, users) => {
    this.setState({ users: users })
    this.handleGitUserChanges()
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
  handleAddUser = () => {
    this.setState({
      userEdits: { name: '', email: '', rsaKeyPath: '', active: true }
    })
  }
  handleSubmitAddUser = async () => {
    const users = userService.add(this.state.userEdits)
    this.setState({
      users,
      userEdits: null
    })
    await this.handleGitUserChanges()
  }
  handleUserFormSubmit = () => {
    this.state.userEdits.id ? this.handleSubmitEditUser() : this.handleSubmitAddUser()
  }
  handleEditUser = user => {
    this.setState({ userEdits: user })
  }
  handleCancelUserForm = () => {
    this.setState({ userEdits: null })
  }
  handleSubmitEditUser = async () => {
    const users = userService.update(this.state.userEdits)
    this.setState({
      users,
      userEdits: null
    })
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
    remote.Menu.buildFromTemplate([
      { label: 'Edit repositories', click: () => this.toggleRepositories() },
      { type: 'separator' },
      { label: 'Quit', click: () => remote.app.quit() }
    ]).popup()
  }

  toggleRepositories = () => {
    this.setState({ showRepositories: !this.state.showRepositories })
  }

  renderContent = () => {
    return (
      <Users
        users={this.state.users}
        onEditUser={this.handleEditUser}
        onAddUser={this.handleAddUser}
        onActiveUsersCleared={this.handleClearActiveUsers}
        onUserActiveToggled={this.handleToggleActiveUser}
        onUserAdded={this.handleAddUser}
        onUserRemoved={this.handleRemoveUser}
        onUserUpdated={this.handleEditUser}
        onUsersRotated={this.handleRotateUsers} />
    )
  }
  render() {
    const { userEdits, showRepositories } = this.state
    const overlayActive = userEdits || showRepositories

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
          <Button onClick={this.handleAddUser}>Add user</Button>
        </div>
        <div styleName={overlayActive ? 'overlay-background-active' : 'overlay-background'} />
        <div styleName="overlay-container" style={{ top: userEdits ? 65 : -150 }}>
          <UserForm
            user={userEdits}
            onChange={this.handleEditUser}
            onConfirm={this.handleUserFormSubmit}
            onClose={this.handleCancelUserForm}
            confirmLabel={userEdits && userEdits.id ? 'Update user' : 'Add user'} />
        </div>
        <div styleName="overlay-container" style={{ top: showRepositories ? 65 : -60 * this.state.repos.length - 100 }}>
          <Repositories repos={this.state.repos}
            onRepoAdded={this.handleAddRepo}
            onDone={this.toggleRepositories}
            onRepoRemoved={this.handleRemoveRepo} />
        </div>
      </div>
    )
  }
}

import React from 'react'
import CSSModules from 'react-css-modules'
import { remote, ipcRenderer } from 'electron'

import * as appApi from '../api/app'
import Button from './components/button'
// import * as gitService from '../services/git'
import ipcChannels from '../../common/ipcChannels'
import { GitIcon, MenuIcon } from './icons'
import * as reposApi from '../api/repositories'
import Repositories from './repositories'
// import * as repoService from '../services/repo'
// import * as userService from '../services/user'
import Users from './users'
import * as usersApi from '../api/users'
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

  async componentDidMount() {
    // const users = userService.get()
    // const repos = repoService.get()

    const users = usersApi.getAllUsers()
    const repos = reposApi.getAllRepos()
    console.log('got all users', users)
    console.log('repos', repos)

    this.setState({
      users,
      repos,
      showRepositories: !repos.length
    })

    // this.setShowUserActions(users)

    usersApi.onUsersUpdated(this.handleUsersUpdated)
    // ipcRenderer.on('users-updated', this.handleUsersUpdated)
  }

  componentWillUnmount() {
    usersApi.removeUsersUpdatedListener(this.handleUsersUpdated)
    // ipcRenderer.removeListener('users-updated', this.handleUsersUpdated)
  }

  handleUsersUpdated = (event, users) => {
    console.log('uses updated', users)
    this.setState({ users })
    // this.handleGitUserChanges()
  }
  handleGitUserChanges = async () => {
    // const { author, committer } = gitService.getAuthorAndCommitter(userService.get())
    //
    // await gitService.setAuthor(author.name, author.email)
    // await gitService.setCommitter(committer.name, committer.email)
  }
  handleRotateUsers = async () => {
    // const updatedUsers = userService.rotate()
    this.setState({
      users: usersApi.rotateActiveUsers()
    })
    // await this.handleGitUserChanges()
  }
  handleClearActiveUsers = async () => {
    // const users = userService.clearActive()
    this.setState({
      users: usersApi.clearActiveUsers()
    })
    // await this.handleGitUserChanges()
  }
  handleToggleActiveUser = async userId => {
    // const users = userService.toggleActive(userId)
    this.setState({
      users: usersApi.toggleUserActive(userId)
    })
    // await this.handleGitUserChanges()
  }
  handleAddUser = () => {
    this.setState({
      userEdits: { name: '', email: '', rsaKeyPath: '', active: true }
    })
  }
  handleSubmitAddUser = async () => {
    this.setState({
      userEdits: null,
      users: usersApi.addUser(this.state.userEdits)
    })

    // const users = userService.add(this.state.userEdits)
    // this.setState({
    //   users,
    //   userEdits: null
    // })
    // await this.handleGitUserChanges()
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

    // const users = userService.update(this.state.userEdits)
    this.setState({
      userEdits: null,
      users: usersApi.updateUser(this.state.userEdits)
    })
    // await this.handleGitUserChanges()
  }
  handleRemoveUser = async userId => {
    usersApi.removeUser(userId)
    // const users = userService.remove(userId)
    // this.setState({ users })
    // await this.handleGitUserChanges()
  }
  handleAddRepo = path => {
    reposApi.addRepo(path)
    // const repos = repoService.add(path)
    // this.setState({ repos })
  }
  handleRemoveRepo = path => {
    reposApi.removeRepo(path)
    // const repos = repoService.remove(path)
    // this.setState({ repos })
  }
  handleMenuButtonClick = () => {
    remote.Menu.buildFromTemplate([
      { label: 'Edit repositories', click: () => this.toggleRepositories() },
      { type: 'separator' },
      { label: 'Quit', click: appApi.quit }
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

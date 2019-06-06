import { remote } from 'electron'
import React from 'react'

import * as appApi from '../api/app'
import Button from './components/button'
import { GitIcon, MenuIcon } from './icons'
import Repositories from './repositories'
import * as reposApi from '../api/repositories'
import Users from './users'
import * as usersApi from '../api/users'
import UserForm from './users/components/user-form'

import css from './index.css'

export default class Menu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      users: [],
      repos: [],
      showRepositories: false
    }
  }

  async componentDidMount() {
    usersApi.onUsersUpdated(this.handleUsersUpdated)
    reposApi.onReposUpdated(this.handleReposUpdated)

    const users = usersApi.getAllUsers()
    const repos = reposApi.getAllRepos()

    this.setState({
      users,
      repos,
      showRepositories: !repos.length || this.state.showRepositories
    })
  }

  componentWillUnmount() {
    usersApi.removeUsersUpdatedListener(this.handleUsersUpdated)
    reposApi.removeReposUpdatedListener(this.handleReposUpdated)
  }

  handleUsersUpdated = (_event, users) => {
    this.setState({ users })
  }
  handleRotateUsers = async () => {
    this.setState({
      users: usersApi.rotateActiveUsers()
    })
  }
  handleToggleActiveUser = async userId => {
    this.setState({
      users: usersApi.toggleUserActive(userId)
    })
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
    this.setState({
      userEdits: null,
      users: usersApi.updateUser(this.state.userEdits)
    })
  }
  handleRemoveUser = async userId => {
    this.setState({
      users: usersApi.removeUser(userId)
    })
  }
  handleReposUpdated = (_event, repos) => {
    this.setState({ repos })
  }
  handleAddRepo = path => {
    this.setState({
      repos: reposApi.addRepo(path)
    })
  }
  handleRemoveRepo = path => {
    this.setState({
      repos: reposApi.removeRepo(path)
    })
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
        onUserActiveToggled={this.handleToggleActiveUser}
        onUserRemoved={this.handleRemoveUser}
        onUserUpdated={this.handleEditUser}
        onUsersRotated={this.handleRotateUsers} />
    )
  }
  render() {
    const { userEdits, showRepositories } = this.state
    const overlayActive = userEdits || showRepositories

    return (
      <div className={css.container}>
        <div className={css.header}>
          <GitIcon /><span className={css.headerTitle}>switch</span>
          <div className={css.menuButtonContainer}>
            <button className={css.menuButton} onClick={this.handleMenuButtonClick}><MenuIcon /></button>
          </div>
        </div>
        {this.renderContent()}
        <div className={css.footer}>
          <Button onClick={this.handleAddUser}>Add user</Button>
        </div>
        <div className={overlayActive ? css.overlayBackgroundActive : css.overlayBackground} />
        <div className={css.overlayContainer} style={{ top: userEdits ? 65 : -150 }}>
          <UserForm
            user={userEdits}
            onChange={this.handleEditUser}
            onConfirm={this.handleUserFormSubmit}
            onClose={this.handleCancelUserForm} />
        </div>
        <div className={css.overlayContainer} style={{ top: showRepositories ? 65 : -60 * this.state.repos.length - 100 }}>
          <Repositories repos={this.state.repos}
            onRepoAdded={this.handleAddRepo}
            onDone={this.toggleRepositories}
            onRepoRemoved={this.handleRemoveRepo} />
        </div>
      </div>
    )
  }
}

import { remote } from 'electron'
import React, { useEffect, useState } from 'react'

import * as api from '../api'
import { Button, Repositories, UserForm, Users } from './components'
import { GitIcon, MenuIcon } from './icons'

import css from './index.css'

export const Menu = () => {
  const [state, setState] = useState({
    repos: [],
    showRepositories: false,
    userEdits: null,
    users: []
  })

  useEffect(() => {
    api.onUsersUpdated(handleUsersUpdated)
    api.onReposUpdated(handleReposUpdated)

    const users = api.getAllUsers()
    const repos = api.getAllRepos()

    setState(prevState => ({
      ...prevState,
      users,
      repos,
      showRepositories: !repos.length || state.showRepositories
    }))

    return () => {
      api.removeUsersUpdatedListener(handleUsersUpdated)
      api.removeReposUpdatedListener(handleReposUpdated)
    }
  }, [])

  const handleUsersUpdated = (_event, users) =>
    setState(prevState => ({
      ...prevState,
      users
    }))

  const handleUserChanges = (func, ...args) => {
    const updatedUsers = func(...args)

    setState(prevState => ({
      ...prevState,
      userEdits: null,
      users: updatedUsers
    }))
  }

  const handleRemoveUser = (userId) => handleUserChanges(api.removeUser, userId)
  const handleRotateUsers = () => handleUserChanges(api.rotateActiveUsers)
  const handleToggleActiveUser = (userId) => handleUserChanges(api.toggleUserActive, userId)

  const handleSubmitAddUser = () => handleUserChanges(api.addUser, state.userEdits)
  const handleSubmitEditUser = () => handleUserChanges(api.updateUser, state.userEdits)
  const handleUserFormSubmit = () => !state.userEdits.id
    ? handleSubmitAddUser()
    : handleSubmitEditUser()

  const handleAddUser = () =>
    setState(prevState => ({
      ...prevState,
      userEdits: { name: '', email: '', rsaKeyPath: '', active: true }
    }))
  const handleEditUser = (user) =>
    setState(prevState => ({
      ...prevState,
      userEdits: user
    }))
  const handleCancelUserForm = () =>
    setState(prevState => ({
      ...prevState,
      userEdits: null
    }))

  const handleReposUpdated = (_event, repos) =>
    setState(prevState => ({
      ...prevState,
      repos
    }))

  const handleRepoChanges = (func, ...args) =>
    setState(prevState => ({
      ...prevState,
      repos: func(...args)
    }))

  const handleAddRepo = (path) => handleRepoChanges(api.addRepo, path)
  const handleRemoveRepo = (path) => handleRepoChanges(api.removeRepo, path)

  const handleMenuButtonClick = () => {
    remote.Menu.buildFromTemplate([
      { label: 'Edit repositories', click: handleToggleRepositories },
      { type: 'separator' },
      { label: 'Quit', click: api.quit }
    ]).popup()
  }

  const handleToggleRepositories = () => {
    setState(prevState => ({
      ...prevState,
      showRepositories: !state.showRepositories
    }))
  }

  const { userEdits, showRepositories } = state
  const overlayActive = userEdits || showRepositories

  return (
    <div className={css.container}>
      <div className={css.header}>
        <GitIcon /><span className={css.headerTitle}>switch</span>
        <div className={css.menuButtonContainer}>
          <button className={css.menuButton} onClick={handleMenuButtonClick}><MenuIcon /></button>
        </div>
      </div>
      <Users
        onEditUser={handleEditUser}
        onUserActiveToggled={handleToggleActiveUser}
        onUserRemoved={handleRemoveUser}
        onUsersRotated={handleRotateUsers}
        users={state.users}
      />
      <div className={css.footer}>
        <Button onClick={handleAddUser}>Add user</Button>
      </div>
      <div className={overlayActive ? css.overlayBackgroundActive : css.overlayBackground} />
      <div className={css.overlayContainer} style={{ top: userEdits ? 65 : -150 }}>
        <UserForm
          onChange={handleEditUser}
          onClose={handleCancelUserForm}
          onConfirm={handleUserFormSubmit}
          user={userEdits}
        />
      </div>
      <div className={css.overlayContainer} style={{ top: showRepositories ? 65 : -60 * state.repos.length - 100 }}>
        <Repositories
          onDone={handleToggleRepositories}
          onRepoAdded={handleAddRepo}
          onRepoRemoved={handleRemoveRepo}
          repos={state.repos}
        />
      </div>
    </div>
  )
}

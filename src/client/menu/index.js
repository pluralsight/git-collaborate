import { remote } from 'electron'
import React, { useEffect, useState } from 'react'

import * as api from '../api'
import { Footer, Header, Overlay, Users } from './components'

import css from './index.css'

export function Menu() {
  const [users, setUsers] = useState([])
  const [repos, setRepos] = useState([])
  const [shouldShowRepos, setShouldShowRepos] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [shouldShowAbout, setShouldShowAbout] = useState(false)

  useEffect(() => {
    api.onUsersUpdated(handleUsersUpdated)
    api.onReposUpdated(handleReposUpdated)

    const users = api.getAllUsers()
    const repos = api.getAllRepos()

    setUsers(users)
    setRepos(repos)

    if (!repos.length) {
      setShouldShowRepos(true)
    }

    return () => {
      api.removeUsersUpdatedListener(handleUsersUpdated)
      api.removeReposUpdatedListener(handleReposUpdated)
    }
  }, [])

  const handleUsersUpdated = (_event, users) => setUsers(users)

  const handleReposUpdated = (_event, repos) => setRepos(repos)

  const handleAddUser = () => {
    setShouldShowRepos(false)
    setSelectedUser({ active: true, email: '', name: '', rsaKeyPath: '' })
  }

  const handleEditUser = (user) => setSelectedUser(user)

  const handleEditRepos = () => {
    setSelectedUser(null)
    setShouldShowRepos(true)
  }

  const handleCloseRepos = () => setShouldShowRepos(false)

  const handleShowAbout = () => setShouldShowAbout(true)

  const handleCloseAbout = () => setShouldShowAbout(false)

  const handleMenuButtonClick = () => {
    remote.Menu.buildFromTemplate([
      { label: 'Edit repositories', click: handleEditRepos },
      { label: 'Add user', click: handleAddUser },
      { type: 'separator' },
      { label: 'About', click: handleShowAbout },
      { label: 'Quit', click: api.quit }
    ]).popup()
  }

  return (
    <div className={css.container}>
      <Header onMenuClick={handleMenuButtonClick} />
      <Users
        onEditUser={handleEditUser}
        setUsers={setUsers}
        users={users}
      />
      <Footer onAddUserClick={handleAddUser} />
      <Overlay
        onCloseAbout={handleCloseAbout}
        onCloseRepos={handleCloseRepos}
        onEditUser={handleEditUser}
        repos={repos}
        setRepos={setRepos}
        setUsers={setUsers}
        shouldShowAbout={shouldShowAbout}
        shouldShowRepos={shouldShowRepos}
        user={selectedUser}
      />
    </div>
  )
}

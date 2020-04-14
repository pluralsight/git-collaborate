import { array, bool, func } from 'prop-types'
import React from 'react'

import { About, Repositories, UserForm } from '../'
import * as api from '../../../api'
import { userType } from '../users/types'

import css from './index.css'

export function Overlay(props) {
  const {
    onCloseAbout,
    onCloseRepos,
    onEditUser,
    repos,
    setRepos,
    setUsers,
    shouldShowAbout,
    shouldShowRepos,
    user
  } = props

  const handleAddUser = () => {
    const updatedUsers = api.addUser(user)

    setUsers(updatedUsers)
    onEditUser(null)
  }

  const handleEditUser = () => {
    const updatedUsers = api.updateUser(user)

    setUsers(updatedUsers)
    onEditUser(null)
  }

  const handleSubmitUserForm = () => !user.id
    ? handleAddUser()
    : handleEditUser()

  const isActive = !!user || shouldShowRepos || shouldShowAbout

  return (
    <>
      <div className={`${css.overlayBackground}${isActive ? ` ${css.active}` : ''}`} />
      <div className={css.overlayContainer} style={{ top: user ? 65 : -150 }}>
        <UserForm
          onEditUser={onEditUser}
          onSubmit={handleSubmitUserForm}
          user={user}
        />
      </div>
      <div className={css.overlayContainer} style={{ top: shouldShowAbout ? 65 : -150 }}>
        <About onClose={onCloseAbout} />
      </div>
      <div className={css.overlayContainer} style={{ top: shouldShowRepos ? 65 : -60 * repos.length - 100 }}>
        <Repositories
          onDone={onCloseRepos}
          repos={repos}
          setRepos={setRepos}
        />
      </div>
    </>
  )
}

Overlay.propTypes = {
  onCloseAbout: func.isRequired,
  onCloseRepos: func.isRequired,
  onEditUser: func.isRequired,
  repos: array.isRequired,
  setRepos: func.isRequired,
  setUsers: func.isRequired,
  shouldShowAbout: bool.isRequired,
  shouldShowRepos: bool.isRequired,
  user: userType
}

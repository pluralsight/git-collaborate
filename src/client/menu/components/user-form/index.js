import { remote } from 'electron'
import { func } from 'prop-types'
import React, { useEffect, useRef, useState } from 'react'

import { Button } from '../'
import { userType } from '../users/types'

import css from './index.css'

export function UserForm(props) {
  const { onEditUser, onSubmit, user } = props

  const [isSelectingRsaKey, setIsSelectingRsaKey] = useState(false)
  const nameInputRef = useRef()

  useEffect(() => {
    if (user && !user.name && !user.email && !user.rsaKeyPath) {
      nameInputRef.current.focus()
    }
  }, [user])

  const handleCancel = () => onEditUser(null)

  const handleFieldChange = (event) => {
    const { id, value } = event.target
    onEditUser({ ...user, [id]: value })
  }

  const handleAddRsaKey = () => {
    setIsSelectingRsaKey(true)
    const dialogOptions = {
      properties: [
        'openFile',
        'showHiddenFiles',
        'treatPackageAsDirectory',
        'dontAddToRecent'
      ]
    }

    const currentWindow = remote.getCurrentWindow()
    remote.dialog.showOpenDialog(currentWindow, dialogOptions)
      .then((result) => {
        setIsSelectingRsaKey(false)

        onEditUser({
          ...user,
          rsaKeyPath: (result.filePaths.length && result.filePaths[0]) || user.rsaKeyPath
        })

        currentWindow.show()
      })
  }

  if (!user) {
    return null
  }

  const confirmLabel = user.id ? 'Update user' : 'Add user'
  const isValid = user.name && user.email && !isSelectingRsaKey

  return (
    <div className={css.form}>
      <div className={css.fieldContainer}>
        <input
          id="name"
          className={css.field}
          value={user.name}
          placeholder="Name"
          onChange={handleFieldChange}
          ref={nameInputRef}
        />
        <input
          id="email"
          className={css.field}
          value={user.email}
          placeholder="Email"
          onChange={handleFieldChange}
        />
        <div className={css.rsaFieldContainer}>
          <input
            id="rsaKeyPath"
            className={css.rsaField}
            value={user.rsaKeyPath}
            placeholder="Path to RSA key"
            onChange={handleFieldChange}
          />
          <Button
            onClick={handleAddRsaKey}
            disabled={isSelectingRsaKey}
          >
            Browse
          </Button>
        </div>
      </div>
      <div className={css.buttonSection}>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button type={Button.types.confirm} onClick={onSubmit} disabled={!isValid}>{confirmLabel}</Button>
      </div>
    </div>
  )
}

UserForm.propTypes = {
  onEditUser: func.isRequired,
  onSubmit: func.isRequired,
  user: userType
}

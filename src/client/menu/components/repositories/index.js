import { remote } from 'electron'
import { array, bool, func, shape, string } from 'prop-types'
import React, { useState } from 'react'

import { Button, DeleteButton, RefreshButton } from '../'
import * as api from '../../../api'

import css from './index.css'

function Repository(props) {
  const { onRepoRefreshed, onRepoRemoved, repo } = props

  const handleRefreshRepo = (path) => () => onRepoRefreshed(path)

  const handleRemoveRepo = (path) => () => onRepoRemoved(path)

  return (
    <li className={repo.isValid ? css.repo : css.repoInvalid}>
      <div className={css.repoInfo}>
        <div className={css.repoName}>
          {repo.name}{repo.isValid ? null : <span className={css.invalidMessage}>(not a git repo)</span>}
        </div>
        <div className={css.repoPath}>{repo.path}</div>
      </div>
      <RefreshButton onClick={handleRefreshRepo(repo.path)} />
      <DeleteButton onClick={handleRemoveRepo(repo.path)} />
    </li>
  )
}

Repository.propTypes = {
  onRepoRefreshed: func.isRequired,
  onRepoRemoved: func.isRequired,
  repo: shape({
    isValid: bool.isRequired,
    name: string.isRequired,
    path: string.isRequired
  })
}

function RepositoriesActions({ onAddRepo, onDone }) {
  const [isSelectingRepos, setIsSelectingRepos] = useState(false)

  const handleAddReposClicked = () => {
    setIsSelectingRepos(true)
    const dialogOptions = {
      buttonLabel: 'Done',
      properties: [
        'openDirectory',
        'multiSelections',
        'dontAddToRecent'
      ],
      title: 'Select git repo(s)'
    }

    const currentWindow = remote.getCurrentWindow()
    const results = remote.dialog.showOpenDialogSync(currentWindow, dialogOptions)

    setIsSelectingRepos(false)
    currentWindow.show()

    if (results && results.length) {
      results.map(onAddRepo)
    }
  }

  return (
    <div className={css.buttons}>
      <Button onClick={handleAddReposClicked} disabled={isSelectingRepos}>Add repos</Button>
      <Button onClick={onDone}>Done</Button>
    </div>
  )
}

RepositoriesActions.propTypes = {
  onAddRepo: func.isRequired,
  onDone: func.isRequired
}

function EmptyState(props) {
  return (
    <>
      <div className={css.emptyMessage}>
        No repositories yet
        <div className={css.emptyMessageSub}>
          Add repositories you want to use with git-collab
        </div>
      </div>
      <RepositoriesActions {...props} />
    </>
  )
}

export function Repositories(props) {
  const { onDone, repos, setRepos } = props

  const handleAddRepo = (path) => setRepos(api.addRepo(path))

  const handleRemoveRepo = (path) => setRepos(api.removeRepo(path))

  return !repos.length
    ? <EmptyState onAddRepo={handleAddRepo} onDone={onDone} />
    : (
      <>
        <ul className={css.reposList}>
          {repos.map((repo) => (
            <Repository
              key={repo.path}
              onRepoRefreshed={handleAddRepo}
              onRepoRemoved={handleRemoveRepo}
              repo={repo}
            />
          ))}
        </ul>
        <RepositoriesActions onAddRepo={handleAddRepo} onDone={onDone} />
      </>
    )
}

Repositories.propTypes = {
  onDone: func.isRequired,
  repos: array.isRequired,
  setRepos: func.isRequired
}

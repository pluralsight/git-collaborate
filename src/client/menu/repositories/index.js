import { remote } from 'electron'
import { array, func } from 'prop-types'
import React from 'react'

import Button from '../components/button'
import DeleteButton from '../components/delete-button'
import RefreshButton from '../components/refresh-button'

import css from './index.css'

export default class Repositories extends React.Component {
  static propTypes = {
    onRepoAdded: func.isRequired,
    onRepoRemoved: func.isRequired,
    onDone: func.isRequired,
    repos: array.isRequired
  }

  constructor(props) {
    super(props)
    this.state = {
      isSelectingRepos: false
    }
  }

  handleAddRepo = () => {
    this.setState({ isSelectingRepos: true })
    remote.dialog.showOpenDialog({
      properties: ['openDirectory', 'multiSelections']
    }, this.handleNewRepoSelected)
  }
  handleNewRepoSelected = paths => {
    this.setState({ isSelectingRepos: false })
    for (const path of paths || []) {
      this.props.onRepoAdded(path)
    }
  }
  handleRefreshRepo = repo => () => {
    this.props.onRepoAdded(repo.path)
  }
  handleRemoveRepo = repo => () => {
    this.props.onRepoRemoved(repo.path)
  }

  renderEmptyMessage = () => {
    if (!this.props.repos.length) {
      return (
        <div className={css.emptyMessage}>
          No repositories yet
          <div className={css.emptyMessageSub}>
            Add repositories you want to use with git-switch
          </div>
        </div>
      )
    }
  }
  renderRepo = repo => (
    <li className={repo.isValid ? css.repo : css.repoInvalid} key={repo.path}>
      <div className={css.repoInfo}>
        <div className={css.repoName}>
          {repo.name}{repo.isValid ? null : <span className={css.invalidMessage}>(not a git repo)</span>}
        </div>
        <div className={css.repoPath}>{repo.path}</div>
      </div>
      <RefreshButton onClick={this.handleRefreshRepo(repo)} />
      <DeleteButton onClick={this.handleRemoveRepo(repo)} />
    </li>
  )
  render() {
    return (
      <div>
        {this.renderEmptyMessage()}
        <ul className={css.reposList}>
          {this.props.repos.map(this.renderRepo)}
        </ul>
        <div className={css.buttons}>
          <Button onClick={this.handleAddRepo} disabled={this.state.isSelectingRepos}>Add repos</Button>
          <Button onClick={this.props.onDone}>Done</Button>
        </div>
      </div>
    )
  }
}

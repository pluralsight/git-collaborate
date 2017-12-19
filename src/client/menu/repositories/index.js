import React from 'react'
import CSSModules from 'react-css-modules'
import { remote } from 'electron'
import { array, func } from 'prop-types'

import Button from '../components/button'
import DeleteButton from '../components/delete-button'

import css from './index.css'

@CSSModules(css)
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
    const newRepos = paths.filter(p => !this.props.repos.some(r => r.path === p))
    for(const path of newRepos) {
      this.props.onRepoAdded(path)
    }
  }
  handleRemoveRepo = repo => () => {
    this.props.onRepoRemoved(repo.path)
  }

  renderEmptyMessage = () => {
    if(!this.props.repos.length) {
      return (
        <div styleName="empty-message">
          No repositories yet
          <div styleName="empty-message-sub">
            Add repositories you want to use with git-switch
          </div>
        </div>
      )
    }
  }
  renderRepo = repo => (
    <li styleName={repo.isValid ? 'repo' : 'repo-invalid'} key={repo.path}>
      <div styleName="repo-info">
        <div styleName="repo-name">
          {repo.name}{repo.isValid ? null : <span styleName="invalid-message">(not a git repo)</span>}
        </div>
        <div styleName="repo-path">{repo.path}</div>
      </div>
      <DeleteButton onClick={this.handleRemoveRepo(repo)} />
    </li>
  )
  render() {
    return (
      <div>
        {this.renderEmptyMessage()}
        <ul styleName="repos-list">
          {this.props.repos.map(this.renderRepo)}
        </ul>
        <div styleName="buttons">
          <Button onClick={this.handleAddRepo} disabled={this.state.isSelectingRepos}>Add repos</Button>
          <Button onClick={this.props.onDone}>Done</Button>
        </div>
      </div>
    )
  }
}

import React from 'react'
import CSSModules from 'react-css-modules'

import { array, func } from 'prop-types'

import AddRepoButton from './components/add-repo-button'
import DeleteButton from '../components/delete-button'

import css from './index.css'

@CSSModules(css)
export default class Repositories extends React.Component {
  static propTypes = {
    onRepoAdded: func.isRequired,
    onRepoRemoved: func.isRequired,
    repos: array.isRequired
  }

  handleAddRepo = path => {
    this.props.onRepoAdded(path)
  }
  handleRemoveRepo = path => {
    this.props.onRepoRemoved(path)
  }

  renderRepo = (repo) => {
    return (
      <li styleName="repo" key={repo.path}>
        <div styleName="repo-info">
          <div styleName="repo-name">{repo.name}</div>
          <div styleName="repo-path">{repo.path}</div>
        </div>
        <DeleteButton onRemove={this.handleRemoveRepo} idToRemove={repo.path} />
      </li>
    )
  }

  render() {
    return (
      <div>
        <ul styleName="repos-list">
          {this.props.repos.map(this.renderRepo)}
        </ul>
        <AddRepoButton onAddRepo={this.handleAddRepo} />
      </div>
    )
  }
}

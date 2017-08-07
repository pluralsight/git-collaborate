import React from 'react'
import CSSModules from 'react-css-modules'

import { func } from 'prop-types'

import Button from '../../../components/button'

import css from './index.css'

@CSSModules(css)
export default class AddRepoButton extends React.Component {
  static propTypes = {
    onAddRepo: func.isRequired
  }
  constructor(props) {
    super(props)
    this.state = { showAddForm: false, path: '' }
  }

  handleFieldChange = e => {
    const { id, value } = e.target
    this.setState({ [id]: value })
  }
  handleAddRepo = () => {
    this.toggleForm()
    this.props.onAddRepo(this.state.path)
  }

  toggleForm = () => {
    this.setState({ showAddForm: !this.state.showAddForm })
  }

  renderAddForm() {
    return (
      <div styleName="form">
        <div styleName="field-container">
          <input
            id="path"
            styleName="field"
            placeholder="/path/to/git/repo"
            onChange={this.handleFieldChange} />
        </div>
        <div styleName="button-section">
          <button styleName="confirm-button" onClick={this.handleAddRepo}>Add repo</button>
          <button styleName="button" onClick={this.toggleForm}>Close</button>
        </div>
      </div>
    )
  }

  render() {
    return !this.state.showAddForm
      ? (
        <div styleName="container">
          <Button onClick={this.toggleForm}>Add repo</Button>
        </div>
      ) : this.renderAddForm()
  }
}

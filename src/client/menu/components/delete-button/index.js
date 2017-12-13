import React from 'react'
import CssModules from 'react-css-modules'
import { func, string } from 'prop-types'

import { BinIcon } from '../../icons'

import css from './index.css'

function DeleteButton(props) {
  return (
    <div styleName="container" onClick={props.onClick}><BinIcon /></div>
  )
}

DeleteButton.propTypes = {
  onClick: func.isRequired
}

export default CssModules(DeleteButton, css)


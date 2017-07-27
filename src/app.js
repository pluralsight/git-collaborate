import * as path from 'path'

import menubar from 'menubar'

menubar({
  dir: __dirname,
  index: 'file://' + path.join(__dirname, 'build', 'index.html')
})

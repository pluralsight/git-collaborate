import menubar from 'menubar'
import * as path from 'path'

menubar({
  dir: __dirname,
  index: 'file://' + path.join(__dirname, 'build', 'index.html')
})

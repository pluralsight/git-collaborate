import chai from 'chai'
import sinonChai from 'sinon-chai'

global.logToConsoleDisabled = true
global.describe = chai.describe
global.beforeEach = chai.beforeEach
global.it = chai.it
global.expect = chai.expect

chai.use(sinonChai)

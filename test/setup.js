import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinonChai from 'sinon-chai'

global.describe = chai.describe
global.beforeEach = chai.beforeEach
global.it = chai.it
global.expect = chai.expect

chai.use(sinonChai)
chai.use(chaiAsPromised)

import axios from 'axios'
import { expect } from 'chai'

import { getLatestVersion } from '../'
import sandbox from '../../../../test/sandbox'

describe('utils/version', () => {
  describe('#getLatestVersion', () => {
    let latestReleaseResponse
    let version

    beforeEach(() => {
      version = '1.0.0'
      latestReleaseResponse = { data: { name: version } }

      sandbox.stub(axios, 'get').callsFake(async () => await latestReleaseResponse)
    })
    afterEach(() => {
      sandbox.restore()
    })

    it('returns version from latest github release', async () => {
      const actual = await getLatestVersion()
      expect(actual).to.equal(version)
    })

    describe('when response has no release name', () => {
      it('returns nothing', async () => {
        latestReleaseResponse = { data: { } }

        const actual = await getLatestVersion()

        expect(actual).to.be.null
      })
    })

    describe('when axios response is empty', () => {
      it('returns nothing', async () => {
        latestReleaseResponse = { }

        const actual = await getLatestVersion()

        expect(actual).to.be.null
      })
    })
  })
})

import { DEFAULT_CONNECTION_CONFIG } from '../Defaults'
import type { UserFacingSocketConfig } from '../Types'
import { makeCommunitiesSocket } from './communities'
import { showBanner } from '../Bermuda/banner'

let bannerShown = false

// export the last socket layer
const makeWASocket = (config: UserFacingSocketConfig) => {
	if (!bannerShown) {
		showBanner()
		bannerShown = true
	}
	const newConfig = {
		...DEFAULT_CONNECTION_CONFIG,
		...config
	}

	// If the user hasn't provided their own history sync function,
	// let's create a default one that respects the syncFullHistory flag.
	// TODO: Change
	if (config.shouldSyncHistoryMessage === undefined) {
		newConfig.shouldSyncHistoryMessage = () => !!newConfig.syncFullHistory
	}

	return makeCommunitiesSocket(newConfig)
}

export default makeWASocket

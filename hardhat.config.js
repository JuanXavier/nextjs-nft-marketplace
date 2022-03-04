require('@nomiclabs/hardhat-waffle');
const fs = require('fs');
const secret = require('./exclusive');

module.exports = {
	defaultNetwork: 'hardhat',
	networks: {
		hardhat: {
			chainId: 1337,
		},
		rinkeby: {
			url: secret.endpoint,
			accounts: [secret.key],
		},
		// mainnet: {
		// 	url: secret.endpoint,
		// 	accounts: [secret.key],
		// },
	},
	solidity: {
		version: '0.8.4',
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
};

const hre = require('hardhat');
const fs = require('fs');

async function main() {
	const Market = await hre.ethers.getContractFactory('Market');
	const market = await Market.deploy();
	await market.deployed();
	console.log('MARKET CONTRACT ADDRESS:', market.address);

	const NFT = await hre.ethers.getContractFactory('NFT');
	const nft = await NFT.deploy(market.address);
	await nft.deployed();
	console.log('NFT CONTRACT ADDRESS:', nft.address);

	let config = `
  	export const marketAddress = ${JSON.stringify(market.address)} 
  	export const nftAddress = ${JSON.stringify(nft.address)}
	`;

	fs.writeFileSync('config.js', JSON.parse(JSON.stringify(config)));
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

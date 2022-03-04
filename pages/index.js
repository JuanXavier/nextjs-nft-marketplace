import {ethers} from 'ethers';
import {useEffect, useState} from 'react';
import axios from 'axios'; //
import Web3Modal from 'web3modal';
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import Market from '../artifacts/contracts/Market.sol/Market.json';
import {nftAddress, marketAddress} from '../config';
import {useRouter} from 'next/router';

export default function Home() {
	const [nfts, setNfts] = useState([]);
	const [loadingState, setLoadingState] = useState('Not loaded yet');
	const router = useRouter();

	useEffect(() => {
		loadNFTs();
	}, []);

	/*-----------------Load NFTs----------------------------*/

	async function loadNFTs() {
		// Detect provider
		const web3Modal = new Web3Modal();
		const connection = await web3Modal.connect();
		const provider = await new ethers.providers.Web3Provider(connection);

		// Contracts
		const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider);
		const marketContract = new ethers.Contract(marketAddress, Market.abi, provider);
		console.log('MARKET CONTRACT:', marketContract);
		console.log('TOKEN CONTRACT:', tokenContract);

		// Get markettokens from Market
		/*	This function gets called without problem when runnning a local node.
		 */
		let data = await marketContract.fetchMarketTokens();

		// Grab info of each NFT
		const items = await Promise.all(
			data.map(async (i) => {
				const tokenUri = await tokenContract.tokenURI(i.tokenId);

				// Get token metadata from json. We get it from uri in token erc721
				const meta = await axios.get(tokenUri);
				console.log(meta);

				let price = ethers.utils.formatUnits(i.price.toString(), 'ether');

				let item = {
					price,
					tokenId: i.tokenId.toNumber(),
					seller: i.seller,
					owner: i.owner,
					image: meta.data.image,
					name: meta.data.name,
					description: meta.data.description,
				};
				return item;
			})
		);

		// Change states
		setNfts(items);
		setLoadingState('loaded');
	}

	/*-----------------------------------------------*/

	async function buyNFT(nft) {
		// Connection to wallet
		const web3Modal = new Web3Modal();
		const connection = await web3Modal.connect();
		const provider = new ethers.providers.Web3Provider(connection);
		const signer = provider.getSigner();

		const contract = new ethers.Contract(marketAddress, Market.abi, signer);

		const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');

		const transaction = await contract.createMarketSale(nftAddress, nft.tokenId, {
			value: price,
		});

		await transaction.wait();

		loadNFTs().then(router.push('./my-nfts'));
	}

	/*--------------------Render----------------------------*/

	if (loadingState === 'loaded' && !nfts.length) {
		return (
			<h1 className='px-20 py-20 font-bold italic text-3xl'>
				There are no NFTs available right now. <br />
				<br />
				You can come back later or mint some yourself!
			</h1>
		);
	}

	return (
		<div className='flex justify-center'>
			<div className='px-4' style={{maxWidth: '1600px'}}>
				<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4'>
					{nfts.map((nft, i) => (
						<div key={i} className='border shadow rounded-lg overflow-hidden'>
							<img src={nft.image} alt='nft' />

							<div className='p-4'>
								<p style={{height: '64px'}} className='text-3xl font-semibold'>
									{nft.name}
								</p>

								<div style={{height: '72px', overflow: 'hidden'}}>
									<p className='text-gray-500 italic'>{nft.description}</p>
								</div>
							</div>

							<div className='p-4 bg-black items-center'>
								<p className='text-3xl mb-4 font-bold text-white'>{nft.price} ETH</p>

								<button
									className='w-full bg-purple-500 text-white font-bold py-3 px-12 rounded-lg'
									onClick={() => buyNFT(nft)}>
									Buy
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

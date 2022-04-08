import {ethers} from 'ethers';
import {useEffect, useState} from 'react';
import axios from 'axios';
import Web3Modal from 'web3modal';
import {nftAddress, marketAddress} from '../config';
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import Market from '../artifacts/contracts/Market.sol/Market.json';

export default function MyAssets() {
	const [nfts, setNfts] = useState([]);
	const [loadingState, setLoadingState] = useState('not-loaded');

	useEffect(() => {
		loadNFTs();
	}, []);

	/*------------------Get users NFTs------------------------*/

	async function loadNFTs() {
		const web3Modal = new Web3Modal();
		const connection = await web3Modal.connect();

		const provider = new ethers.providers.Web3Provider(connection);
		const signer = provider.getSigner();

		const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider);
		const marketContract = new ethers.Contract(marketAddress, Market.abi, signer);

		const data = await marketContract.fetchMyNFTs();

		const items = await Promise.all(
			data.map(async (i) => {
				const tokenUri = await tokenContract.tokenURI(i.tokenId);
				const meta = await axios.get(tokenUri);
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

		setNfts(items);
		setLoadingState('loaded');
	}

	/*--------------------Render----------------------------*/

	if (loadingState === 'loaded' && !nfts.length) {
		return (
			<h1 className='px-20 py-20 text-3xl italic'>
				You do not own any NFTs currently
				<br />
				:(
			</h1>
		);
	}

	return (
		<div>
			<h1 className='pt-4 text-3xl font-bold italic hover:opacity-80'>My NFTS</h1>
			<div className=' flex justify-center px-4' style={{maxWidth: '1600px'}}>
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4'>
					{nfts.map((nft, i) => (
						<div key={i} className='h-full border shadow rounded-lg overflow-hidden'>
							<img width='300' height='300' className='h-80' src={nft.image} alt='img' />

							<div className='p-4'>
								<p className='text-2xl font-semibold mb-3'>{nft.name}</p>

								<div style={{/*height: '72px'*/ overflow: 'hidden'}}>
									<p className='text-gray-400 italic '>{nft.description}</p>
								</div>
							</div>
							<div className='p-4 bg-black'>
								<p className='text-1xl mb-1 font-bold text-white'>{nft.price} ETH</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

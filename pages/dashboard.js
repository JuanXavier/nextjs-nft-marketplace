import {ethers} from 'ethers';
import {useEffect, useState} from 'react';
import axios from 'axios';
import Web3Modal from 'web3modal';
import {nftAddress, marketAddress} from '../config';
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import Market from '../artifacts/contracts/Market.sol/Market.json';

export default function AccountDashboard() {
	const [nfts, setNfts] = useState([]); //minted
	const [sold, setSold] = useState([]); //sold
	const [loadingState, setLoadingState] = useState('not-loaded');

	useEffect(() => {
		loadNFTs();
	}, []);

	/*---------------------Check for sold NFTs------------------------*/

	async function loadNFTs() {
		const web3Modal = new Web3Modal();
		const connection = await web3Modal.connect();
		const provider = new ethers.providers.Web3Provider(connection);

		const signer = provider.getSigner();
		console.log(await provider.listAccounts());

		const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider);
		const marketContract = new ethers.Contract(marketAddress, Market.abi, signer);

		const data = await marketContract.fetchItemsCreated();

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

		const soldItems = items.filter((i) => i.sold);
		setSold(soldItems);

		setNfts(items);
		setLoadingState('loaded');
	}

	/*--------------------Render----------------------------*/

	if (loadingState === 'loaded' && !nfts.length) {
		return (
			<h1 className='px-20 py-20 text-3xl italic '>You have not minted NFTs yet :/</h1>
		);
	}

	return (
		<div>
			<h1 className='pt-4 text-3xl font-bold italic hover:opacity-80'>
				My minted Tokens
			</h1>
			<div className='px-4' style={{maxWidth: '1600px'}}>
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4'>
					{nfts.map((nft, i) => (
						<div key={i} className='border shadow rounded-lg overflow-hidden'>
							<img src={nft.image} alt='nft' />
							<div className='p-4'>
								<p style={{height: '64px'}} className='text-3x1 font-semibold'>
									{nft.name}
								</p>
								<div style={{height: '72px', overflow: 'hidden'}}>
									<p className='text-gray-400'>{nft.description}</p>
								</div>
							</div>
							<div className='p-4 bg-black'>
								<p className='text-3xl mb-4 font-bold text-white'>{nft.price} ETH</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

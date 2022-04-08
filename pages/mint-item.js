import {ethers} from 'ethers';
import {useState} from 'react';
import Web3Modal from 'web3modal';
import {create as ipfsHttpClient} from 'ipfs-http-client';
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import Market from '../artifacts/contracts/Market.sol/Market.json';
import {nftAddress, marketAddress} from '../config';
import {useRouter} from 'next/router';

/*----------------------SET IPFS TO HOST NFT DATA------------------------*/

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');

export default function MintItem() {
	// NFT url
	const [fileUrl, setFileUrl] = useState(null);

	// NFT information
	const [formInput, updateFormInput] = useState({
		price: '',
		name: '',
		description: '',
	});

	const router = useRouter();

	/*------------Update files in our form for IPFS-----------------*/

	async function onChange(e) {
		const file = e.target.files[0];

		try {
			const added = await client.add(file, {
				progress: (prog) => console.log(`received: ${prog}`),
			});

			const url = `https://ipfs.infura.io/ipfs/${added.path}`;

			setFileUrl(url);
		} catch (error) {
			console.log('Error uploading file:', error);
		}
	}

	/*-----------------------Mint----------------------------------*/

	async function createMarket() {
		const {name, description, price} = formInput;

		if (!name || !description || !price || !fileUrl) {
			return;
		}

		// Stringify the metadata before uploading it
		const data = JSON.stringify({
			name,
			description,
			image: fileUrl,
		});

		// Create a sale passing the url and data
		try {
			const added = await client.add(data);
			const url = `https://ipfs.infura.io/ipfs/${added.path}`;

			createSale(url);
		} catch (error) {
			console.log('Error uploading file:', error);
		}
	}

	/*-------------Create items and list them in marketplace-------------*/

	async function createSale(url) {
		const web3Modal = new Web3Modal();
		const connection = await web3Modal.connect();
		const provider = new ethers.providers.Web3Provider(connection);
		const signer = provider.getSigner();

		// Create NFT by using the mintToken function on NFT SC
		let contract = new ethers.Contract(nftAddress, NFT.abi, signer);
		let transaction = await contract.mintToken(url);

		let tx = await transaction.wait();
		let event = tx.events[0];
		let value = event.args[2];

		let tokenId = value.toNumber();
		const price = ethers.utils.parseUnits(formInput.price, 'ether');

		// Replace NFT SC with Market SC
		contract = new ethers.Contract(marketAddress, Market.abi, signer);

		// List item for sale in marketplace
		let listingPrice = (await contract.getListingPrice()).toString();

		// Replace mintToken tx with makeMarketItem tx
		transaction = await contract.makeMarketItem(nftAddress, tokenId, price, {
			value: listingPrice,
		});

		await transaction.wait().then(router.push('./'));
	}

	/*-----------------------------------------------------*/

	return (
		<div className='flex justify-center'>
			<div className='w-1/2 flex flex-col pb-12'>
				<input
					placeholder='NFT Name'
					className='mt-8 border rounded p-3'
					onChange={(e) => updateFormInput({...formInput, name: e.target.value})}
				/>

				<textarea
					placeholder='NFT Description'
					className='mt-2 border rounded p-3'
					onChange={(e) => updateFormInput({...formInput, description: e.target.value})}
				/>

				<input
					placeholder='NFT Price in ETH'
					className='mt-2 border rounded p-3'
					onChange={(e) => updateFormInput({...formInput, price: e.target.value})}
				/>

				<input type='file' name='Asset' className='mt-4 text-sm' onChange={onChange} />

				{/* Preview image before*/}
				{fileUrl && (
					<img
						alt='nft preview'
						className=' rounded-lg mt-4'
						width='350px'
						src={fileUrl}
					/>
				)}

				<button
					onClick={createMarket}
					className='font-bold mt-4 bg-purple-600 text-white rounded-lg p-4 shadow-lg'>
					Mint NFT
				</button>
			</div>
		</div>
	);
}

import '../styles/globals.css';
import '../styles/app.css';
import Link from 'next/link';
import {useEffect} from 'react';

export default function KryptoBirdMarketplace({Component, pageProps}) {
	useEffect(() => {
		window.ethereum.on('accountsChanged', () => {
			location.reload();
		});
		window.ethereum.on('chainChanged', () => {
			location.reload();
		});
	}, []);

	return (
		<div>
			<nav className='p-4 bg-gradient-to-br from-pink-300 to-purple-500'>
				<p className='text-3xl font-bold pb-3'>NFT Marketplace</p>

				<div className='flex mt-4 justify-evenly'>
					<Link href='/'>
						<a className='text-lg mr-10 font-bold'>Main Marketplace</a>
					</Link>
					<Link href='/mint-item'>
						<a className='text-lg mr-10 font-bold'>Mint Tokens</a>
					</Link>
					<Link href='/my-nfts'>
						<a className='text-lg mr-10 font-bold'>My NFTs</a>
					</Link>
					<Link href='/dashboard'>
						<a className='text-lg mr-10 font-bold'>Dashboard</a>
					</Link>
				</div>
			</nav>
			<Component {...pageProps} />
		</div>
	);
}

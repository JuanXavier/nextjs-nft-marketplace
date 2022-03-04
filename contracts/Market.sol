//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import 'hardhat/console.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

contract Market is ReentrancyGuard {
	using Counters for Counters.Counter;

	Counters.Counter private _tokenIds;
	Counters.Counter private _tokensSold;

	address payable owner;

	// Commission for the owner
	uint256 listingPrice = 0.0045 ether;

	constructor() {
		owner = payable(msg.sender);
	}

	// Structure of each token to keep track of them
	struct MarketToken {
		uint256 itemId;
		address nftContract;
		uint256 tokenId;
		address payable seller;
		address payable owner;
		uint256 price;
		bool sold;
	}

	// Mapping with Ids as a key to each token
	mapping(uint256 => MarketToken) private idToMarketToken;

	// listen to event from front end apps
	event MarketTokenMinted(
		uint256 indexed itemId,
		address indexed nftContract,
		uint256 indexed tokenId,
		address seller,
		address owner,
		uint256 price,
		bool sold
	);

	function getListingPrice() public view returns (uint256) {
		return listingPrice;
	}

	/*--------------------Put item up for sale--------------------*/

	function makeMarketItem(
		address nftContract,
		uint256 tokenId,
		uint256 price
	) public payable nonReentrant {
		require(price > 0, 'Price must be at least one wei');
		require(msg.value == listingPrice, 'Price must be equal to listing price');

		// Keep track of tokens
		_tokenIds.increment();
		uint256 itemId = _tokenIds.current();

		// Put it up for sale
		idToMarketToken[itemId] = MarketToken(
			itemId,
			nftContract,
			tokenId,
			payable(msg.sender), // Minter
			payable(address(0)), // No owner yet
			price,
			false
		);

		// Pass the NFT contract info with transferFrom function derived from IERC721
		IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

		// Emit information from the event
		emit MarketTokenMinted(
			itemId,
			nftContract,
			tokenId,
			msg.sender,
			address(0),
			price,
			false
		);
	}

	/*-----------------------Buy----------------------------*/

	function createMarketSale(address nftContract, uint256 itemId)
		public
		payable
		nonReentrant
	{
		// Obtain the price and tokenId via dot notation from the MarketToken struct
		uint256 price = idToMarketToken[itemId].price;
		uint256 tokenId = idToMarketToken[itemId].tokenId;

		require(msg.value == price, 'Please submit the asking price in order to continue');

		// Transfer the amount to the seller
		// idToMarketToken[itemId].seller.transfer(msg.value);
		(bool success, ) = idToMarketToken[itemId].seller.call{value: msg.value}('');
		require(success = true);

		// Transfer the token from this contract to the buyer
		IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);

		// Update the owner and isSold status
		idToMarketToken[itemId].owner = payable(msg.sender);
		idToMarketToken[itemId].sold = true;

		_tokensSold.increment();

		// Transfer commission from buyer to seller
		payable(owner).transfer(listingPrice);
		// idToMarketToken[itemId].owner.call{value: listingPrice}('');
	}

	/*--------------------------Unsold NFTs---------------------------------*/

	function fetchMarketTokens() public view returns (MarketToken[] memory) {
		uint256 itemCount = _tokenIds.current();
		uint256 unsoldItemCount = _tokenIds.current() - _tokensSold.current();
		uint256 currentIndex = 0;

		// Create a fixed array that contains a new instance of the struct
		// with the quantity of unsold items
		MarketToken[] memory items = new MarketToken[](unsoldItemCount);

		/*
			If the looped item's owner address is 0 (meaning it has no owner):
				1. grab its loop index and assign it to currentId,
				2. create a new MarketToken struct called currentItem and assign its values
						to the ones obtained from the currentId.
				3. assign that item to the unsold items array called items
				4. increment the currentIndex variable
		*/

		for (uint256 i = 0; i < itemCount; i++) {
			if (idToMarketToken[i + 1].owner == address(0)) {
				uint256 currentId = i + 1;
				MarketToken storage currentItem = idToMarketToken[currentId];
				items[currentIndex] = currentItem;
				currentIndex += 1;
			}
		}

		return items;
	}

	/*--------------------------Owned NFTs---------------------------------*/

	function fetchMyNFTs() public view returns (MarketToken[] memory) {
		uint256 totalItemCount = _tokenIds.current();

		// Counter for each individual user
		uint256 itemCount = 0;

		uint256 currentIndex = 0;

		// If the msg.sender is the owner of a token, add it to itemCount
		for (uint256 i = 0; i < totalItemCount; i++) {
			if (idToMarketToken[i + 1].owner == msg.sender) {
				itemCount += 1;
			}
		}

		// Create a fixed array that contains a new instance of the struct
		// with the quantity of owned items
		MarketToken[] memory items = new MarketToken[](itemCount);

		/*
			If the msg.sender is the owner of the nft:
				1. grab the token from the index and assign its itemId to the loop variable currentId,
				2. create a new MarketToken struct called currentItem and assign its values
						to the ones obtained from the currentId token in idToMarketToken mapping
				3. assign that item to the local array of owned items called items
				4. increment the currentIndex variable
		*/

		for (uint256 i = 0; i < totalItemCount; i++) {
			if (idToMarketToken[i + 1].owner == msg.sender) {
				uint256 currentId = idToMarketToken[i + 1].itemId;
				MarketToken storage currentItem = idToMarketToken[currentId];
				items[currentIndex] = currentItem;
				currentIndex += 1;
			}
		}
		return items;
	}

	/*--------------------------Minted NFTs---------------------------------*/

	function fetchItemsCreated() public view returns (MarketToken[] memory) {
		uint256 totalItemCount = _tokenIds.current();
		uint256 itemCount = 0;
		uint256 currentIndex = 0;

		for (uint256 i = 0; i < totalItemCount; i++) {
			if (idToMarketToken[i + 1].seller == msg.sender) {
				itemCount += 1;
			}
		}

		MarketToken[] memory items = new MarketToken[](itemCount);

		for (uint256 i = 0; i < totalItemCount; i++) {
			if (idToMarketToken[i + 1].seller == msg.sender) {
				uint256 currentId = idToMarketToken[i + 1].itemId;
				MarketToken storage currentItem = idToMarketToken[currentId];
				items[currentIndex] = currentItem;
				currentIndex += 1;
			}
		}
		return items;
	}
}

/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@rytell/exchange-contracts/contracts/core/interfaces/IRytellPair.sol";

interface ICalculatePrice {
  function getPrice()
    external
    view
    returns (
      uint256,
      uint256,
      uint256 lpTokensAmount
    );
}

contract ERC721Metadata is ERC721Enumerable, Ownable {
  using Strings for uint256;

  // Base URI
  string private baseURI;
  string public baseExtension = ".json";
  uint256 private _maxNftSupply;

  constructor(
    string memory name_,
    string memory symbol_,
    string memory baseURI_,
    uint256 maxNftSupply_
  ) ERC721(name_, symbol_) {
    setBaseURI(baseURI_);

    _maxNftSupply = maxNftSupply_;
  }

  function setBaseURI(string memory baseURI_) private onlyOwner {
    require(
      keccak256(abi.encodePacked((baseURI))) !=
        keccak256(abi.encodePacked((baseURI_))),
      "ERC721Metadata: existed baseURI"
    );
    baseURI = baseURI_;
  }

  function tokenURI(uint256 tokenId)
    public
    view
    override
    returns (string memory)
  {
    require(
      tokenId <= _maxNftSupply,
      "ERC721Metadata: URI query for nonexistent token"
    );

    // TODO: redeploy because this was using a negation
    require(_exists(tokenId), "This Token doesn't exist");

    return
      bytes(baseURI).length > 0
        ? string(abi.encodePacked(baseURI, tokenId.toString(), baseExtension))
        : "";
  }
}

/// @title TheLandsOfRytell
contract TheLandsOfRytell is ERC721Metadata {
  using SafeMath for uint256;
  using Counters for Counters.Counter;

  uint256 public constant MAX_NFT_SUPPLY = 2400;

  bool public paused = true;
  uint256 public pendingCount = MAX_NFT_SUPPLY;

  mapping(uint256 => address) public _minters;
  mapping(address => uint256) public _mintedByWallet;

  // Admin wallet
  address private _admin;

  uint256 private _totalSupply;
  uint256[2401] private _pendingIDs;

  address public priceCalculatorAddress;
  address public avaxRadiPairAddress;

  constructor(
    string memory baseURI_,
    address admin_,
    address _priceCalculatorAddress,
    address _avaxRadiPairAddress, // LP token contract
    string memory name,
    string memory symbol
  ) ERC721Metadata(name, symbol, baseURI_, MAX_NFT_SUPPLY) {
    // ) ERC721Metadata("The lands of Rytell", "TLOR", baseURI_, MAX_NFT_SUPPLY) {
    _admin = admin_;
    priceCalculatorAddress = _priceCalculatorAddress;
    avaxRadiPairAddress = _avaxRadiPairAddress;
  }

  function totalSupply() public view override returns (uint256) {
    return _totalSupply;
  }

  /// @dev This function collects all the token IDs of a wallet.
  /// @param owner_ This is the address for which the balance of token IDs is returned.
  /// @return an array of token IDs.
  function walletOfOwner(address owner_)
    external
    view
    returns (uint256[] memory)
  {
    uint256 ownerTokenCount = balanceOf(owner_);
    uint256[] memory tokenIDs = new uint256[](ownerTokenCount);
    for (uint256 i = 0; i < ownerTokenCount; i++) {
      tokenIDs[i] = tokenOfOwnerByIndex(owner_, i);
    }
    return tokenIDs;
  }

  function mint(uint256 counts_) external {
    require(pendingCount > 0, "Rytell: All minted");
    require(counts_ > 0, "Rytell: Counts cannot be zero");
    require(
      totalSupply().add(counts_) <= MAX_NFT_SUPPLY,
      "Rytell: sale already ended"
    );
    require(!paused, "Rytell: The contract is paused");

    (, , uint256 priceLpTokens) = ICalculatePrice(priceCalculatorAddress)
      .getPrice();

    uint256 senderBalance = IRytellPair(avaxRadiPairAddress).balanceOf(
      _msgSender()
    );

    require(
      senderBalance >= priceLpTokens.mul(counts_),
      "You don't have enough AVAX/RADI LP tokens."
    );

    IRytellPair(avaxRadiPairAddress).transferFrom(
      _msgSender(),
      _admin,
      priceLpTokens.mul(counts_)
    );

    for (uint256 i = 0; i < counts_; i++) {
      _randomMint(_msgSender());
      _totalSupply += 1;
    }
  }

  function _randomMint(address to_) private returns (uint256) {
    require(to_ != address(0), "Rytell: zero address");

    require(totalSupply() < MAX_NFT_SUPPLY, "Rytell: max supply reached");

    uint256 randomIn = _getRandom().mod(pendingCount).add(1);

    uint256 tokenID = _popPendingAtIndex(randomIn);

    _minters[tokenID] = to_;
    _mintedByWallet[to_] += 1;

    _safeMint(to_, tokenID);

    return tokenID;
  }

  function _popPendingAtIndex(uint256 index_) private returns (uint256) {
    uint256 tokenID = _pendingIDs[index_].add(index_);

    if (index_ != pendingCount) {
      uint256 lastPendingID = _pendingIDs[pendingCount].add(pendingCount);
      _pendingIDs[index_] = lastPendingID.sub(index_);
    }

    pendingCount -= 1;
    return tokenID;
  }

  function _getRandom() private view returns (uint256) {
    return
      uint256(
        keccak256(
          abi.encodePacked(block.difficulty, block.timestamp, pendingCount)
        )
      );
  }

  function pause(bool state_) public onlyOwner {
    paused = state_;
  }
}

//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

interface ISeal {
    function tokensOfOwner(address owner_)
        external
        view
        returns (uint256[] memory);

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;
}

/** TBD */
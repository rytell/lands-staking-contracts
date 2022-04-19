//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract StakeLands is Ownable {
    address[] public landCollections;
    address public heroContract;
    address public cryptosealsContract;

    constructor(address _cryptosealsContract, address _heroContract) {
        cryptosealsContract = _cryptosealsContract;
        heroContract = _heroContract;
    }

    function addLandCollection(address landCollection) public onlyOwner {
        landCollections.push(landCollection);
    }

    function removeLandCollection(address landCollection) public onlyOwner {
        for (uint256 index = 0; index < landCollections.length; index++) {
            if (landCollections[index] == landCollection) {
                landCollections[index] = landCollections[
                    landCollections.length - 1
                ];
                landCollections.pop();
            }
        }
    }

    function landCollectionsSize() public view returns (uint256) {
        return landCollections.length;
    }
}

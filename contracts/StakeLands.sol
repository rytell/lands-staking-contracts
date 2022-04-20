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

interface IRytellHero {
    function walletOfOwner(address owner_)
        external
        view
        returns (uint256[] memory);

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;
}

interface IRytellLand {
    function walletOfOwner(address owner_)
        external
        view
        returns (uint256[] memory);

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;
}

contract StakeLands is Ownable, IERC721Receiver {
    struct HeroStatus {
        bool staked;
        uint256 lastStaked;
        uint256 lastUnstaked;
        uint256 heroId;
        address owner;
        uint256[] lands;
        address[] relatedLandCollections;
    }

    address[] public landCollections;
    address public heroContract;
    address public cryptosealsContract;

    mapping(address => HeroStatus[]) public stakedHeros;

    event ReceivedERC721(
        address operator,
        address from,
        uint256 tokenId,
        bytes data
    );
    event StakedHeroWithLands(
        address who,
        uint256 heroNumber,
        uint256 when,
        address[] collections,
        uint256[] lands
    );
    event UnstakedHeroWithLands(
        address who,
        uint256 heroNumber,
        uint256 when,
        address[] collections,
        uint256[] lands
    );
    event AddedLandToHero(
        address who,
        uint256 heroNumber,
        uint256 when,
        address collection,
        uint256 land
    );
    event RemovedLandFromHero(
        address who,
        uint256 heroNumber,
        uint256 when,
        address collection,
        uint256 land
    );
    event SwappedHero(
        address who,
        uint256 oldeHero,
        uint256 newHero,
        uint256 when
    );

    constructor(address _cryptosealsContract, address _heroContract) {
        cryptosealsContract = _cryptosealsContract;
        heroContract = _heroContract;
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        emit ReceivedERC721(operator, from, tokenId, data);
        return IERC721Receiver(this).onERC721Received.selector;
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

    function contractOwnsHero(uint256 heroNumber) public view returns (bool) {
        uint256[] memory accountHeros = IRytellHero(heroContract).walletOfOwner(
            address(this)
        );
        for (uint256 index = 0; index < accountHeros.length; index++) {
            if (accountHeros[index] == heroNumber) {
                return true;
            }
        }

        return false;
    }

    function senderOwnsHero(uint256 heroNumber) public view returns (bool) {
        uint256[] memory accountHeros = IRytellHero(heroContract).walletOfOwner(
            msg.sender
        );
        for (uint256 index = 0; index < accountHeros.length; index++) {
            if (accountHeros[index] == heroNumber) {
                return true;
            }
        }

        return false;
    }

    function senderOwnsLand(address collection, uint256 landNumber)
        public
        view
        returns (bool)
    {
        uint256[] memory accountLands = IRytellLand(collection).walletOfOwner(
            msg.sender
        );
        for (uint256 index = 0; index < accountLands.length; index++) {
            if (accountLands[index] == landNumber) {
                return true;
            }
        }

        return false;
    }

    function acquireHeroOwnership(uint256 heroNumber) private {
        IRytellHero(heroContract).safeTransferFrom(
            msg.sender,
            address(this),
            heroNumber
        );
    }

    function acquireLandOwnership(address collection, uint256 landNumber)
        private
    {
        IRytellLand(collection).safeTransferFrom(
            msg.sender,
            address(this),
            landNumber
        );
    }

    function stakeHeroWithLands(
        uint256 hero,
        uint256[] memory lands,
        address[] memory collections
    ) public {
        require(senderOwnsHero(hero), "You don't own this hero");
        /** lands */
        for (uint256 landIndex = 0; landIndex < lands.length; landIndex++) {
            require(
                senderOwnsLand(collections[landIndex], lands[landIndex]),
                "You don't own this land"
            );
            acquireLandOwnership(collections[landIndex], lands[landIndex]);
        }
        acquireHeroOwnership(hero);
        uint256 time = block.timestamp;
        HeroStatus[] storage herosOfAccount = stakedHeros[msg.sender];
        if (herosOfAccount.length > 0) {
            bool foundHero = false;
            for (uint256 index = 0; index < herosOfAccount.length; index++) {
                if (herosOfAccount[index].heroId == hero) {
                    require(
                        herosOfAccount[index].staked == false,
                        "Hero is already staked"
                    );
                    herosOfAccount[index].lastStaked = block.timestamp;
                    herosOfAccount[index].staked = true;
                    herosOfAccount[index].owner = msg.sender;
                    herosOfAccount[index].lands = lands;
                    herosOfAccount[index].relatedLandCollections = collections;
                    foundHero = true;
                    emit StakedHeroWithLands(
                        msg.sender,
                        hero,
                        time,
                        collections,
                        lands
                    );
                    return;
                }
            }

            if (foundHero == false) {
                herosOfAccount.push(
                    HeroStatus({
                        staked: true,
                        lastStaked: time,
                        lastUnstaked: 0,
                        heroId: hero,
                        owner: msg.sender,
                        lands: lands,
                        relatedLandCollections: collections
                    })
                );
                emit StakedHeroWithLands(
                    msg.sender,
                    hero,
                    time,
                    collections,
                    lands
                );
            }
        } else {
            herosOfAccount.push(
                HeroStatus({
                    staked: true,
                    lastStaked: time,
                    lastUnstaked: 0,
                    heroId: hero,
                    owner: msg.sender,
                    lands: lands,
                    relatedLandCollections: collections
                })
            );
            emit StakedHeroWithLands(
                msg.sender,
                hero,
                time,
                collections,
                lands
            );
        }
    }

    function addLandsToHero(
        uint256 hero,
        uint256[] memory lands,
        address[] memory collections
    ) public {
        require(contractOwnsHero(hero), "Hero is not staked");
    }

    function removeLandsToHero(
        uint256 hero,
        uint256[] memory lands,
        address[] memory collections
    ) public {
        require(contractOwnsHero(hero), "Hero is not staked");
    }

    function removeHeroWithLands(uint256 hero) public {
        require(contractOwnsHero(hero), "Hero is not staked");
    }

    function swapHero(uint256 actualHero, uint256 newHero) public {
        require(contractOwnsHero(actualHero), "Hero is not staked");
    }
}

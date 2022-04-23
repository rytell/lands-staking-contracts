//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "hardhat/console.sol";

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
    }

    struct LandStatus {
        bool staked;
        uint256 landId;
        address collection;
        uint256 level;
        uint256 heroId;
        address owner;
        uint256 lastStaked;
        uint256 lastUnstaked;
    }

    address[] public landCollections;
    address public heroContract;
    uint256 public MAX_LANDS_PER_HERO = 8;

    mapping(address => HeroStatus[]) public stakedHeros;
    mapping(address => LandStatus[]) public stakedLands;

    event ReceivedERC721(
        address operator,
        address from,
        uint256 tokenId,
        bytes data
    );
    event StakedHeroWithLands(address who, uint256 heroNumber, uint256 when);
    event UnstakedHeroWithLands(address who, uint256 heroNumber, uint256 when);
    event StakedLand(
        bool staked,
        uint256 landId,
        address collection,
        uint256 level,
        uint256 heroId,
        address owner,
        uint256 lastStaked,
        uint256 lastUnstaked
    );
    event UnstakedLand(
        bool staked,
        uint256 landId,
        address collection,
        uint256 level,
        uint256 heroId,
        address owner,
        uint256 lastStaked,
        uint256 lastUnstaked
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

    constructor(address _heroContract) {
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

    function collectionIsWhitelisted(address collection)
        public
        view
        returns (bool)
    {
        require(collection != address(0), "Collection must be a valid address");
        for (uint256 index = 0; index < landCollections.length; index++) {
            if (collection == landCollections[index]) {
                return true;
            }
        }

        return false;
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

    function contractOwnsLand(address collection, uint256 landNumber)
        public
        view
        returns (bool)
    {
        uint256[] memory accountLands = IRytellLand(collection).walletOfOwner(
            address(this)
        );
        for (uint256 index = 0; index < accountLands.length; index++) {
            if (accountLands[index] == landNumber) {
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

    function senderStakedHero(uint256 heroNumber) public view returns (bool) {
        HeroStatus[] storage accountHeros = stakedHeros[msg.sender];
        for (uint256 index = 0; index < accountHeros.length; index++) {
            if (
                accountHeros[index].heroId == heroNumber &&
                accountHeros[index].staked
            ) {
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

    function senderStakedLand(address collection, uint256 landNumber)
        public
        view
        returns (bool)
    {
        LandStatus[] storage accountLands = stakedLands[msg.sender];
        for (uint256 index = 0; index < accountLands.length; index++) {
            if (
                accountLands[index].landId == landNumber &&
                accountLands[index].collection == collection &&
                accountLands[index].staked
            ) {
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
        require(
            lands.length == collections.length,
            "lands and collections arrays don't match on size"
        );
        require(
            lands.length <= MAX_LANDS_PER_HERO,
            "MAX_LANDS_PER_HERO exceeded"
        );
        require(senderOwnsHero(hero), "You don't own this hero");
        uint256 time = block.timestamp;
        /** lands */
        for (uint256 landIndex = 0; landIndex < lands.length; landIndex++) {
            if (collections[landIndex] == address(0)) {
                continue;
            }
            require(
                collectionIsWhitelisted(collections[landIndex]),
                "Collection is not whitelisted"
            );
            require(
                senderOwnsLand(collections[landIndex], lands[landIndex]),
                "You don't own this land"
            );
            acquireLandOwnership(collections[landIndex], lands[landIndex]);
            _setLandStaked(
                hero,
                lands[landIndex],
                collections[landIndex],
                time
            );
        }
        acquireHeroOwnership(hero);
        _setHeroStaked(hero, time);
    }

    function unstakeHero(uint256 heroNumber) public {
        require(
            senderStakedHero(heroNumber),
            "Rytell: this hero is not currently staked"
        );
        require(
            contractOwnsHero(heroNumber),
            "Rytell: we don't have this hero"
        );
        uint256 time = block.timestamp;
        HeroStatus[] storage herosOfAccount = stakedHeros[msg.sender];
        for (uint256 index = 0; index < herosOfAccount.length; index++) {
            if (herosOfAccount[index].heroId == heroNumber) {
                herosOfAccount[index].lastUnstaked = time;
                herosOfAccount[index].staked = false;
                IRytellHero(heroContract).safeTransferFrom(
                    address(this),
                    msg.sender,
                    heroNumber
                );
                (
                    uint256[] memory heroLands,
                    address[] memory heroCollections,
                    bool[] memory stakedStatus
                ) = getHeroLands(msg.sender, heroNumber);
                for (
                    uint256 landIndex = 0;
                    landIndex < heroLands.length;
                    landIndex++
                ) {
                    if (
                        heroLands[landIndex] != uint256(0) &&
                        heroCollections[landIndex] != address(0) &&
                        stakedStatus[landIndex] != false
                    ) {
                        _unstakeLand(
                            heroCollections[landIndex],
                            heroLands[landIndex]
                        );
                    }
                }
                emit UnstakedHeroWithLands(msg.sender, heroNumber, time);
            }
        }
    }

    function getHeroLands(address owner, uint256 hero)
        public
        view
        returns (
            uint256[] memory,
            address[] memory,
            bool[] memory
        )
    {
        LandStatus[] storage ownerLands = stakedLands[owner];
        uint256[] memory lands = new uint256[](ownerLands.length);
        address[] memory collections = new address[](ownerLands.length);
        bool[] memory stakedStatus = new bool[](ownerLands.length);

        for (uint256 index = 0; index < ownerLands.length; index++) {
            if (ownerLands[index].heroId == hero) {
                lands[index] = ownerLands[index].landId;
                collections[index] = ownerLands[index].collection;
                stakedStatus[index] = ownerLands[index].staked;
            }
        }

        return (lands, collections, stakedStatus);
    }

    function _setHeroStaked(uint256 hero, uint256 time) internal {
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
                    foundHero = true;
                    emit StakedHeroWithLands(msg.sender, hero, time);
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
                        owner: msg.sender
                    })
                );
                emit StakedHeroWithLands(msg.sender, hero, time);
            }
        } else {
            herosOfAccount.push(
                HeroStatus({
                    staked: true,
                    lastStaked: time,
                    lastUnstaked: 0,
                    heroId: hero,
                    owner: msg.sender
                })
            );
            emit StakedHeroWithLands(msg.sender, hero, time);
        }
    }

    function _setLandStaked(
        uint256 hero,
        uint256 land,
        address collection,
        uint256 time
    ) internal {
        LandStatus[] storage landsOfAccount = stakedLands[msg.sender];
        if (landsOfAccount.length > 0) {
            bool foundLand = false;
            for (uint256 index = 0; index < landsOfAccount.length; index++) {
                if (
                    landsOfAccount[index].landId == land &&
                    landsOfAccount[index].collection == collection
                ) {
                    require(
                        landsOfAccount[index].staked == false,
                        "Land is already staked"
                    );
                    landsOfAccount[index].lastStaked = time;
                    landsOfAccount[index].staked = true;
                    landsOfAccount[index].owner = msg.sender;
                    foundLand = true;
                    emit StakedLand(
                        true,
                        land,
                        collection,
                        1,
                        hero,
                        msg.sender,
                        time,
                        0
                    );
                    return;
                }
            }

            if (foundLand == false) {
                landsOfAccount.push(
                    LandStatus({
                        staked: true,
                        lastStaked: time,
                        lastUnstaked: 0,
                        heroId: hero,
                        owner: msg.sender,
                        landId: land,
                        collection: collection,
                        level: 1
                    })
                );
                emit StakedLand(
                    true,
                    land,
                    collection,
                    1,
                    hero,
                    msg.sender,
                    time,
                    0
                );
            }
        } else {
            landsOfAccount.push(
                LandStatus({
                    staked: true,
                    lastStaked: time,
                    lastUnstaked: 0,
                    heroId: hero,
                    owner: msg.sender,
                    landId: land,
                    collection: collection,
                    level: 1
                })
            );
            emit StakedLand(
                true,
                land,
                collection,
                1,
                hero,
                msg.sender,
                time,
                0
            );
        }
    }

    function _unstakeLand(address collection, uint256 landNumber) internal {
        require(
            senderStakedLand(collection, landNumber),
            "This land is not currently staked"
        );
        require(
            contractOwnsLand(collection, landNumber),
            "Rytell: we don't have this land"
        );
        uint256 time = block.timestamp;
        LandStatus[] storage landsOfAccount = stakedLands[msg.sender];
        for (uint256 index = 0; index < landsOfAccount.length; index++) {
            if (
                landsOfAccount[index].landId == landNumber &&
                landsOfAccount[index].collection == collection
            ) {
                landsOfAccount[index].lastUnstaked = time;
                landsOfAccount[index].staked = false;
                landsOfAccount[index].heroId = 0;
                IRytellLand(collection).safeTransferFrom(
                    address(this),
                    msg.sender,
                    landNumber
                );
                emit UnstakedLand(
                    false,
                    landNumber,
                    collection,
                    landsOfAccount[index].level,
                    landsOfAccount[index].heroId,
                    msg.sender,
                    landsOfAccount[index].lastStaked,
                    time
                );
            }
        }
    }

    function addLandsToHero(
        uint256 hero,
        address[] memory collections,
        uint256[] memory lands
    ) public {
        require(
            senderStakedHero(hero),
            "Rytell: this hero is not currently staked"
        );
        require(contractOwnsHero(hero), "Rytell: we don't have this hero");
        require(
            collections.length == lands.length,
            "Collections and Lands given don't match"
        );
        require(
            lands.length <= MAX_LANDS_PER_HERO,
            "MAX_LANDS_PER_HERO exceeded"
        );

        uint256 landsCount = 0;
        (
            uint256[] memory heroLands,
            ,
            bool[] memory stakedStatus
        ) = getHeroLands(msg.sender, hero);
        for (uint256 index = 0; index < heroLands.length; index++) {
            if (stakedStatus[index]) {
                landsCount += 1;
            }
        }

        require(
            landsCount + lands.length <= 8,
            "MAX_LANDS_PER_HERO exceeded with additional lands"
        );
        uint256 time = block.timestamp;

        for (uint256 landIndex = 0; landIndex < lands.length; landIndex++) {
            require(
                senderOwnsLand(collections[landIndex], lands[landIndex]),
                "You don't own this land"
            );
            acquireLandOwnership(collections[landIndex], lands[landIndex]);
            _setLandStaked(
                hero,
                lands[landIndex],
                collections[landIndex],
                time
            );
            emit AddedLandToHero(
                msg.sender,
                hero,
                time,
                collections[landIndex],
                lands[landIndex]
            );
        }
    }

    function removeLandsFromHero(
        uint256 hero,
        address[] memory collections,
        uint256[] memory lands
    ) public {
        require(
            senderStakedHero(hero),
            "Rytell: this hero is not currently staked"
        );
        require(contractOwnsHero(hero), "Rytell: we don't have this hero");
        require(
            collections.length == lands.length,
            "Collections and Lands given don't match"
        );

        uint256 landsCount = 0;
        (
            uint256[] memory heroLands,
            address[] memory heroCollections,
            bool[] memory stakedStatus
        ) = getHeroLands(msg.sender, hero);
        for (uint256 index = 0; index < heroLands.length; index++) {
            if (stakedStatus[index]) {
                landsCount += 1;
            }
        }

        require(
            landsCount > 0 && landsCount - lands.length > 0,
            "a hero must be staked at least with one land"
        );
        uint256 time = block.timestamp;

        for (uint256 landIndex = 0; landIndex < heroLands.length; landIndex++) {
            if (
                heroLands[landIndex] != uint256(0) &&
                heroCollections[landIndex] != address(0) &&
                stakedStatus[landIndex] != false
            ) {
                for (
                    uint256 removalIndex = 0;
                    removalIndex < lands.length;
                    removalIndex++
                ) {
                    if (
                        lands[removalIndex] == heroLands[landIndex] &&
                        collections[removalIndex] == heroCollections[landIndex]
                    ) {
                        _unstakeLand(
                            heroCollections[landIndex],
                            heroLands[landIndex]
                        );
                        emit RemovedLandFromHero(
                            msg.sender,
                            hero,
                            time,
                            heroCollections[landIndex],
                            heroLands[landIndex]
                        );
                    }
                }
            }
        }
        emit UnstakedHeroWithLands(msg.sender, hero, time);
    }

    function swapHero(uint256 targetHero, uint256 newHero) public {
        require(senderStakedHero(targetHero), "You didn't stake this hero");
        require(senderOwnsHero(newHero), "Must own the hero you want to stake");

        LandStatus[] storage lands = stakedLands[msg.sender];
        for (uint256 index = 0; index < lands.length; index++) {
            if (lands[index].heroId == targetHero) {
                lands[index].heroId = newHero;
            }
        }

        unstakeHero(targetHero);
        acquireHeroOwnership(newHero);
        _setHeroStaked(newHero, block.timestamp);
    }
}

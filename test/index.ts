import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract } from "ethers";

describe("Stake Lands", function () {
  let owner: SignerWithAddress;
  let stakers: SignerWithAddress[];
  const landCollections: Contract[] = [];
  const LAND_COLLECTIONS_TO_DEPLOY = 18; // 17 mintable lands + 2 claimable lands
  let stakeLands: Contract;

  let wood: Contract;
  let wheat: Contract;
  let stone: Contract;
  let iron: Contract;

  let heros: Contract;

  let testWavax: any;
  let testUsdc: any;
  let testRadi: any;
  let factory: any;
  let router: any;
  let avaxUsdc: any;
  let avaxRadi: any;
  let priceCalculator: any;
  const BASE_USD_PRICE = 1;
  const INITIAL_USDC_INJECTION_AMOUNT = "750000";

  const testDeployAmount = ethers.utils.parseEther("1000000000").toString();
  const usdcDeployAmount = ethers.utils.parseUnits("1000000000", 6).toString();

  this.beforeEach(async function () {
    [owner, ...stakers] = await ethers.getSigners();

    // deploy test tokens
    const WAVAX = await ethers.getContractFactory("WAVAX");
    testWavax = await WAVAX.deploy();
    await testWavax.deployed();
    const USDC = await ethers.getContractFactory("TestUsdc");
    testUsdc = await USDC.deploy(usdcDeployAmount, owner.address);
    await testUsdc.deployed();

    const RADI = await ethers.getContractFactory("TestRadi");
    testRadi = await RADI.deploy(testDeployAmount, owner.address);
    await testRadi.deployed();

    // Deploy factory
    const RytellFactory = await ethers.getContractFactory("RytellFactory");
    factory = await RytellFactory.deploy(owner.address);
    await factory.deployed();

    // Deploy router swap / inject-remove liquidity / comunicates with factory to create pair token
    const RytellRouter = await ethers.getContractFactory("RytellRouter");
    router = await RytellRouter.deploy(factory.address, testWavax.address);
    await router.deployed();

    // TODO approve router to take all injector account tokens
    await testWavax.approve(router.address, ethers.constants.MaxUint256);
    await testUsdc.approve(router.address, ethers.constants.MaxUint256);
    await testRadi.approve(router.address, ethers.constants.MaxUint256);

    // inject initial liquidity
    // inject initial liquidity in avax usdc pair to set price $10.000
    await router.addLiquidityAVAX(
      testUsdc.address,
      ethers.utils.parseUnits(INITIAL_USDC_INJECTION_AMOUNT, 6).toString(),
      "1",
      "1",
      owner.address,
      new Date().getTime() + 1000 * 60 * 60 * 60,
      {
        value: ethers.utils.parseEther("10000"),
      }
    );

    // inject initial liquidity in avax radi pair to set an arbitrary price
    await router.addLiquidityAVAX(
      testRadi.address,
      ethers.utils.parseEther("37731600").toString(),
      "1",
      "1",
      owner.address,
      new Date().getTime() + 1000 * 60 * 60 * 60,
      {
        value: ethers.utils.parseEther("10000"),
      }
    );

    // get pairs lp tokens addresses.
    const RytellPair = await ethers.getContractFactory("RytellPair");
    avaxUsdc = await RytellPair.attach(
      await factory.getPair(testWavax.address, testUsdc.address)
    );
    avaxRadi = await RytellPair.attach(
      await factory.getPair(testWavax.address, testRadi.address)
    );

    // initialize PriceCalculator
    const CalculatePrice = await ethers.getContractFactory("CalculatePrice");
    priceCalculator = await CalculatePrice.deploy(
      testWavax.address,
      testUsdc.address,
      testRadi.address,
      factory.address,
      BASE_USD_PRICE
    );
    await priceCalculator.deployed();

    const TheLandsOfRytell = await ethers.getContractFactory(
      "TheLandsOfRytell"
    );
    for (let index = 0; index < LAND_COLLECTIONS_TO_DEPLOY; index++) {
      landCollections[index] = await TheLandsOfRytell.deploy(
        "ipfs://QmPT1Ah1ucxBSekD8MbQi9khunAe73mAusjede5xJkcApm/",
        owner.address,
        priceCalculator.address,
        avaxRadi.address,
        `The lands of Rytell${index !== 0 ? " " + (index + 1) : ""}`,
        `TLOR${index !== 0 ? " " + (index + 1) : ""}`
      );
      await landCollections[index].deployed();
      await landCollections[index].pause(false);
      // should not revert if allowed and enough
      await avaxRadi.approve(
        landCollections[index].address,
        ethers.constants.MaxUint256
      );
      await landCollections[index].mint(8);
    }

    /** HEROS */
    const Heros = await ethers.getContractFactory("Rytell");
    heros = await Heros.deploy(
      "ipfs://QmXHJfoMaDiRuzgkVSMkEsMgQNAtSKr13rtw5s59QoHJAm/",
      "ipfs://Qmdg8GAFvo2BFNiXA3oCTH34cLojQUrbLL6yGYZHaKFSHm/hidden.json",
      owner.address
    );
    await heros.deployed();
    await heros.pause(false);
    await heros.reveal();
    await heros.mint(5, { value: ethers.utils.parseEther("12.5") });

    const StakeLands = await ethers.getContractFactory("StakeLands");
    // @ts-ignore
    stakeLands = await StakeLands.deploy(heros.address);
    await stakeLands.deployed();
    await stakeLands.setResource("radi", testRadi.address);

    const Resource = await ethers.getContractFactory("Resource");

    wood = await Resource.deploy(owner.address, "Rytell Wooden Plank", "RWPLK");
    await wood.deployed();
    await wood.addManager(stakeLands.address);
    await stakeLands.setResource("wood", wood.address);

    wheat = await Resource.deploy(owner.address, "Rytell Wheat", "RWHT");
    await wheat.deployed();
    await wheat.addManager(stakeLands.address);
    await stakeLands.setResource("wheat", wheat.address);

    stone = await Resource.deploy(owner.address, "Rytell Stone Block", "RSBLK");
    await stone.deployed();
    await stone.addManager(stakeLands.address);
    await stakeLands.setResource("stone", stone.address);

    iron = await Resource.deploy(owner.address, "Rytell Iron Ore", "RIORE");
    await iron.deployed();
    await iron.addManager(stakeLands.address);
    await stakeLands.setResource("iron", iron.address);
    await stakeLands.setResourceRecipientWallet(owner.address);
  });

  // it("Should compile", async function () {
  //   console.log("landCollections: ", landCollections.length);
  //   console.log("stakers: ", stakers.length);
  //   console.log("stake lands contract: ", stakeLands.address);
  //   expect(true).to.equal(true);
  // });

  // it("Should let owner add collections after deployment", async function () {
  //   for (let index = 0; index < LAND_COLLECTIONS_TO_DEPLOY; index++) {
  //     await expect(stakeLands.addLandCollection(landCollections[index].address))
  //       .not.to.be.reverted;
  //   }

  //   const landCollectionsAvailable = await stakeLands.landCollectionsSize();
  //   expect(landCollectionsAvailable).to.equal(LAND_COLLECTIONS_TO_DEPLOY);
  // });

  // it("Should let owner remove collections", async function () {
  //   for (let index = 2; index < LAND_COLLECTIONS_TO_DEPLOY; index++) {
  //     await expect(
  //       stakeLands.removeLandCollection(landCollections[index].address)
  //     ).not.to.be.reverted;
  //   }

  //   const landCollectionsAvailable = await stakeLands.landCollectionsSize();
  //   expect(landCollectionsAvailable).to.equal(0);
  // });

  // it("Should let stakers initiate stake heroes with lands and unstake", async () => {
  //   // whitelist collections
  //   for (let index = 0; index < LAND_COLLECTIONS_TO_DEPLOY; index++) {
  //     await expect(stakeLands.addLandCollection(landCollections[index].address))
  //       .not.to.be.reverted;

  //     // approve lands of this collection
  //     await landCollections[index].setApprovalForAll(stakeLands.address, true);
  //   }

  //   // Approve for all heros
  //   await heros.setApprovalForAll(stakeLands.address, true);

  //   const herosOnWallet = await heros.walletOfOwner(owner.address);

  //   const arrayOfHeroLands = [];
  //   const arrayOfHeroCollections = [];
  //   for (let heroIndex = 0; heroIndex < 4; heroIndex++) {
  //     for (let collectionIndex = 0; collectionIndex < 5; collectionIndex++) {
  //       !arrayOfHeroCollections[heroIndex]
  //         ? (arrayOfHeroCollections[heroIndex] = [
  //             landCollections[collectionIndex].address,
  //           ])
  //         : arrayOfHeroCollections[heroIndex].push(
  //             landCollections[collectionIndex].address
  //           );

  //       const ownLands = await landCollections[collectionIndex].walletOfOwner(
  //         owner.address
  //       );
  //       !arrayOfHeroLands[heroIndex]
  //         ? (arrayOfHeroLands[heroIndex] = [ownLands[heroIndex]])
  //         : arrayOfHeroLands[heroIndex].push(ownLands[heroIndex]);
  //     }
  //   }

  //   for (let heroIndex = 0; heroIndex < 4; heroIndex++) {
  //     const landsForHero = arrayOfHeroLands[heroIndex];
  //     const collectionsForHero = arrayOfHeroCollections[heroIndex];
  //     await expect(
  //       stakeLands.stakeHeroWithLands(
  //         herosOnWallet[heroIndex],
  //         landsForHero,
  //         collectionsForHero
  //       )
  //     ).not.to.be.reverted;
  //   }

  //   for (let heroIndex = 0; heroIndex < 4; heroIndex++) {
  //     await expect(stakeLands.unstakeHero(herosOnWallet[heroIndex])).not.to.be
  //       .reverted;
  //   }

  //   let unstakedLandIdx = 0;
  //   while (true) {
  //     try {
  //       expect(
  //         (await stakeLands.stakedLands(owner.address, unstakedLandIdx)).staked
  //       ).to.equal(false);
  //     } catch (error) {
  //       break;
  //     }
  //     unstakedLandIdx++;
  //   }

  //   for (let heroIndex = 0; heroIndex < 4; heroIndex++) {
  //     const landsForHero = arrayOfHeroLands[heroIndex];
  //     const collectionsForHero = arrayOfHeroCollections[heroIndex];
  //     await expect(
  //       stakeLands.stakeHeroWithLands(
  //         herosOnWallet[heroIndex],
  //         landsForHero,
  //         collectionsForHero
  //       )
  //     ).not.to.be.reverted;
  //   }

  //   let landIdx = 0;
  //   while (true) {
  //     try {
  //       expect(
  //         (await stakeLands.stakedLands(owner.address, landIdx)).staked
  //       ).to.equal(true);
  //     } catch (error) {
  //       break;
  //     }
  //     landIdx++;
  //   }
  // });

  // it("Should let a staker add a land to a hero and remove all but one", async () => {
  //   // whitelist collections
  //   for (let index = 0; index < LAND_COLLECTIONS_TO_DEPLOY; index++) {
  //     await expect(stakeLands.addLandCollection(landCollections[index].address))
  //       .not.to.be.reverted;

  //     // approve lands of this collection
  //     await landCollections[index].setApprovalForAll(stakeLands.address, true);
  //   }

  //   // Approve for all heros
  //   await heros.setApprovalForAll(stakeLands.address, true);

  //   const herosOnWallet = await heros.walletOfOwner(owner.address);
  //   const landsForHero = [];
  //   const collectionsForHero = [];

  //   for (let collectionIndex = 0; collectionIndex < 4; collectionIndex++) {
  //     collectionsForHero.push(landCollections[collectionIndex].address);
  //     const ownLands = await landCollections[collectionIndex].walletOfOwner(
  //       owner.address
  //     );
  //     landsForHero.push(ownLands[0]);
  //   }

  //   await expect(
  //     stakeLands.stakeHeroWithLands(
  //       herosOnWallet[0],
  //       landsForHero,
  //       collectionsForHero
  //     )
  //   ).not.to.be.reverted;

  //   const additionalLandsForHero = [];
  //   const additionalCollectionsForHero = [];

  //   for (let collectionIndex = 4; collectionIndex < 5; collectionIndex++) {
  //     additionalCollectionsForHero.push(
  //       landCollections[collectionIndex].address
  //     );
  //     const ownLands = await landCollections[collectionIndex].walletOfOwner(
  //       owner.address
  //     );
  //     additionalLandsForHero.push(ownLands[0]);
  //   }

  //   await expect(
  //     stakeLands.addLandsToHero(
  //       herosOnWallet[0],
  //       additionalCollectionsForHero,
  //       additionalLandsForHero
  //     )
  //   ).not.to.be.reverted;

  //   // shouldn't allow a sixt land
  //   const ninthCollectionForHero = landCollections[9].address;
  //   const ownLands = await landCollections[9].walletOfOwner(owner.address);
  //   const ninthLandForHero = ownLands[0];
  //   await expect(
  //     stakeLands.addLandsToHero(
  //       herosOnWallet[0],
  //       [ninthCollectionForHero],
  //       [ninthLandForHero]
  //     )
  //   ).to.be.revertedWith("MAX_LANDS_PER_HERO exceeded with additional lands");

  //   const landsToRemove = [];
  //   const landCollectionsToRemove = [];

  //   // should allow to remove 4 lands
  //   for (let collectionIndex = 0; collectionIndex < 4; collectionIndex++) {
  //     landCollectionsToRemove.push(landCollections[collectionIndex].address);
  //     landsToRemove.push(landsForHero[collectionIndex]);
  //   }

  //   await expect(
  //     stakeLands.removeLandsFromHero(
  //       herosOnWallet[0],
  //       landCollectionsToRemove,
  //       landsToRemove
  //     )
  //   ).not.to.be.reverted;

  //   // should not allow to remove all lands
  //   await expect(
  //     stakeLands.removeLandsFromHero(
  //       herosOnWallet[0],
  //       additionalCollectionsForHero,
  //       additionalLandsForHero
  //     )
  //   ).to.be.revertedWith("a hero must be staked at least with one land");
  // });

  // it("Should let a staker swap heros", async () => {
  //   // whitelist collections
  //   for (let index = 0; index < LAND_COLLECTIONS_TO_DEPLOY; index++) {
  //     await expect(stakeLands.addLandCollection(landCollections[index].address))
  //       .not.to.be.reverted;

  //     // approve lands of this collection
  //     await landCollections[index].setApprovalForAll(stakeLands.address, true);
  //   }

  //   // Approve for all heros
  //   await heros.setApprovalForAll(stakeLands.address, true);

  //   const herosOnWallet = await heros.walletOfOwner(owner.address);
  //   const landsForHero = [];
  //   const collectionsForHero = [];

  //   for (let collectionIndex = 0; collectionIndex < 5; collectionIndex++) {
  //     collectionsForHero.push(landCollections[collectionIndex].address);
  //     const ownLands = await landCollections[collectionIndex].walletOfOwner(
  //       owner.address
  //     );
  //     landsForHero.push(ownLands[0]);
  //   }

  //   // stake a hero with some lands
  //   await expect(
  //     stakeLands.stakeHeroWithLands(
  //       herosOnWallet[0],
  //       landsForHero,
  //       collectionsForHero
  //     )
  //   ).not.to.be.reverted;

  //   // remove some lands
  //   const landsToRemove = [];
  //   const landCollectionsToRemove = [];

  //   for (let collectionIndex = 2; collectionIndex < 4; collectionIndex++) {
  //     landCollectionsToRemove.push(landCollections[collectionIndex].address);
  //     landsToRemove.push(landsForHero[collectionIndex]);
  //   }

  //   await expect(
  //     stakeLands.removeLandsFromHero(
  //       herosOnWallet[0],
  //       landCollectionsToRemove,
  //       landsToRemove
  //     )
  //   ).not.to.be.reverted;

  //   // swap hero
  //   await expect(stakeLands.swapHero(herosOnWallet[0], herosOnWallet[1])).not.to
  //     .be.reverted;
  // });

  // it("Should let contract manager mint resources to an account", async () => {
  //   // let stakers[0] (account) have some resources
  //   await testRadi.approve(stakeLands.address, ethers.constants.MaxUint256);

  //   await expect(
  //     stakeLands.mintResources(
  //       [
  //         wood.address,
  //         stone.address,
  //         iron.address,
  //         wheat.address,
  //         testRadi.address,
  //       ],
  //       [1000, 1000, 1000, 1000, 1000],
  //       stakers[0].address
  //     )
  //   ).not.to.be.reverted;
  //   expect(await wood.balanceOf(stakers[0].address)).to.equal(1000);
  //   expect(await stone.balanceOf(stakers[0].address)).to.equal(1000);
  //   expect(await iron.balanceOf(stakers[0].address)).to.equal(1000);
  //   expect(await wheat.balanceOf(stakers[0].address)).to.equal(1000);
  //   expect(await testRadi.balanceOf(stakers[0].address)).to.equal(1000);
  // });

  it("Should let contract manager level a hero lands up", async () => {
    // from owner to stakers[0]
    await avaxRadi.transfer(stakers[0].address, "200000000000000000000");

    // stakers[0] mints 8 lands of each collection
    for (let index = 0; index < LAND_COLLECTIONS_TO_DEPLOY; index++) {
      await avaxRadi
        .connect(stakers[0])
        .approve(landCollections[index].address, ethers.constants.MaxUint256);
      await landCollections[index].connect(stakers[0]).mint(8);

      // whitelist collection
      await expect(stakeLands.addLandCollection(landCollections[index].address))
        .not.to.be.reverted;

      // approve lands of this collection
      await landCollections[index]
        .connect(stakers[0])
        .setApprovalForAll(stakeLands.address, true);
    }

    // stakers[0] mints 5 heros
    await heros
      .connect(stakers[0])
      .mint(5, { value: ethers.utils.parseEther("12.5") });

    // stakers[0] stakes a hero with some lands
    const herosOfStaker = await heros.walletOfOwner(stakers[0].address);

    const landsToStake = [];
    const collectionsToStake = [];
    for (let index = 0; index < 5; index++) {
      collectionsToStake.push(landCollections[index].address);
      const stakerLandsOfCollection = await landCollections[
        index
      ].walletOfOwner(stakers[0].address);
      landsToStake.push(stakerLandsOfCollection[0]);
    }

    // Approve for all heros
    await heros.connect(stakers[0]).setApprovalForAll(stakeLands.address, true);

    // stake a hero with some lands
    await expect(
      stakeLands
        .connect(stakers[0])
        .stakeHeroWithLands(herosOfStaker[0], landsToStake, collectionsToStake)
    ).not.to.be.reverted;

    // let stakers[0] (account) have some resources
    await testRadi.approve(stakeLands.address, ethers.constants.MaxUint256);

    await expect(
      stakeLands.mintResources(
        [
          wood.address,
          stone.address,
          iron.address,
          wheat.address,
          testRadi.address,
        ],
        [1000, 1000, 1000, 1000, 1000],
        stakers[0].address
      )
    ).not.to.be.reverted;
    expect(await wood.balanceOf(stakers[0].address)).to.equal(1000);
    expect(await stone.balanceOf(stakers[0].address)).to.equal(1000);
    expect(await iron.balanceOf(stakers[0].address)).to.equal(1000);
    expect(await wheat.balanceOf(stakers[0].address)).to.equal(1000);
    expect(await testRadi.balanceOf(stakers[0].address)).to.equal(1000);

    await wood
      .connect(stakers[0])
      .approve(stakeLands.address, ethers.constants.MaxUint256);
    await wheat
      .connect(stakers[0])
      .approve(stakeLands.address, ethers.constants.MaxUint256);
    await stone
      .connect(stakers[0])
      .approve(stakeLands.address, ethers.constants.MaxUint256);
    await iron
      .connect(stakers[0])
      .approve(stakeLands.address, ethers.constants.MaxUint256);
    await testRadi
      .connect(stakers[0])
      .approve(stakeLands.address, ethers.constants.MaxUint256);

    // level staker hero lands up (onlyOwner)
    await expect(
      stakeLands.levelHeroLandsUp(
        [
          wood.address,
          stone.address,
          iron.address,
          wheat.address,
          testRadi.address,
        ],
        [10, 10, 10, 10, 10],
        herosOfStaker[0],
        stakers[0].address,
        stakers[0].address
      )
    ).not.to.be.reverted;

    // level some lands up (onlyOwner)
    await expect(
      stakeLands.levelLandsUp(
        [
          wood.address,
          stone.address,
          iron.address,
          wheat.address,
          testRadi.address,
        ],
        [10, 10, 10, 10, 10],
        collectionsToStake,
        landsToStake,
        stakers[0].address,
        stakers[0].address
      )
    ).not.to.be.reverted;

    const heroLands = await stakeLands.getHeroLands(
      stakers[0].address,
      herosOfStaker[0]
    );

    const [, , , levels] = heroLands;
    expect(levels.every((item: BigNumber) => item.toNumber() === 3)).to.equal(
      true
    );

    // level some lands up (onlyOwner)
    for (let index = 0; index < 47; index++) {
      await expect(
        stakeLands.levelLandsUp(
          [
            wood.address,
            stone.address,
            iron.address,
            wheat.address,
            testRadi.address,
          ],
          [1, 1, 1, 1, 1],
          collectionsToStake,
          landsToStake,
          stakers[0].address,
          stakers[0].address
        )
      ).not.to.be.reverted;
    }

    await expect(
      stakeLands.levelLandsUp(
        [
          wood.address,
          stone.address,
          iron.address,
          wheat.address,
          testRadi.address,
        ],
        [1, 1, 1, 1, 1],
        collectionsToStake,
        landsToStake,
        stakers[0].address,
        stakers[0].address
      )
    ).to.be.revertedWith("MAX LEVEL FOR LAND ALREADY ACHIEVED");

    const heroLandsAfterLevel = await stakeLands.getHeroLands(
      stakers[0].address,
      herosOfStaker[0]
    );

    const [, , , levelsAfter] = heroLandsAfterLevel;
    expect(
      levelsAfter.every((item: BigNumber) => item.toNumber() === 50)
    ).to.equal(true);

    const firstLandOfStaker = await stakeLands.stakedLands(
      stakers[0].address,
      0
    );

    expect(firstLandOfStaker.lastLeveledUp.toNumber() * 1000).to.be.greaterThan(
      0
    );
    expect(firstLandOfStaker.lastLeveledUp.toNumber() * 1000).to.be.greaterThan(
      new Date().getTime()
    );
  });
});

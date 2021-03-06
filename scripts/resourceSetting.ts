// @ts-nocheck
import { ethers } from "hardhat";
import { ChainId, Token } from "@rytell/sdk";

export const STAKING_LAND_V1 = {
  [ChainId.FUJI]: "0xC9f30592480b3FB2B7aeAa02bb99bA09E2865107",
  [ChainId.AVALANCHE]: "0xAE0409727A3A8D2FCA564E183FDeD971288b3125",
};

// solves a critical bug from v1
export const STAKING_LAND_V2 = {
  [ChainId.FUJI]: "0xCEc841fA9c9BeFD5A861571EE5E55168672EDf24",
  [ChainId.AVALANCHE]: "0xd19f43e483A67D70888DA1547c2375732b4B5879",
};

// eslint-disable-next-line no-unused-vars
const STAKE_LANDS: { [chainId in ChainId]: string } = {
  // [ChainId.FUJI]: "0xA49117a4815fb484934B1A9Dbbb9F839515E79f4", // v3
  // [ChainId.FUJI]: "0xA6184BE7102048F6C27828d77a246652850bb827", // v3 with public migrated fields
  [ChainId.FUJI]: "0x19aE2a813Bc10147a3700101359AdD1579aa9274", // v3 with heros migrated as well with lands
  [ChainId.AVALANCHE]: "0x25600Cc62b221e05AEfAF8060C3CFd855911cEB6",
};

const RADI = {
  [ChainId.FUJI]: new Token(
    ChainId.FUJI,
    "0xCcA36c23E977d6c2382dF43e930BC8dE9daC897E",
    18,
    "RADI",
    "RADI"
  ),
  [ChainId.AVALANCHE]: new Token(
    ChainId.AVALANCHE,
    "0x9c5bBb5169B66773167d86818b3e149A4c7e1d1A",
    18,
    "RADI",
    "RADI"
  ),
};

const WOOD = {
  [ChainId.FUJI]: new Token(
    ChainId.FUJI,
    "0xd1d80Ddcc05043EDE8eC1585C1cA3d7EBc61Ae5E",
    18,
    "RWPLK",
    "Rytell Wooden Plank"
  ),
  [ChainId.AVALANCHE]: new Token(
    ChainId.AVALANCHE,
    "0x4c0E28fFedBFc761a7be92596ff8c7940188b684",
    18,
    "RWPLK",
    "Rytell Wooden Plank"
  ),
};
const WHEAT = {
  [ChainId.FUJI]: new Token(
    ChainId.FUJI,
    "0xFb0c48CfB87939afD8642E615B4e5acaeADe9AE8",
    18,
    "RWHT",
    "Rytell Wheat"
  ),
  [ChainId.AVALANCHE]: new Token(
    ChainId.AVALANCHE,
    "0xD73d3E047266EaB2309F9929AafE8Fc3e7cEC072",
    18,
    "RWHT",
    "Rytell Wheat"
  ),
};
const STONE = {
  [ChainId.FUJI]: new Token(
    ChainId.FUJI,
    "0xe3228aD79B201c1e32318ed9dE51b53cDB055237",
    18,
    "RSBLK",
    "Rytell Stone Block"
  ),
  [ChainId.AVALANCHE]: new Token(
    ChainId.AVALANCHE,
    "0xdcA5a32D4528378e5B9a553a2A0bcFc14B9c2D1e",
    18,
    "RSBLK",
    "Rytell Stone Block"
  ),
};
const IRON = {
  [ChainId.FUJI]: new Token(
    ChainId.FUJI,
    "0xbF23C85C5890892e3c9D94aC61fD4c1573CbeD57",
    18,
    "RIORE",
    "Rytell Iron Ore"
  ),
  [ChainId.AVALANCHE]: new Token(
    ChainId.AVALANCHE,
    "0x3D05755C9Abad73951594D37891982b9c917BDAF",
    18,
    "RIORE",
    "Rytell Iron Ore"
  ),
};

const currentChain = ChainId.AVALANCHE;

export const GAME_EMISSIONS_FUND = {
  [ChainId.FUJI]: "0x3059bbb4a86a502b7c2a838a4a87baf680887c04",
  [ChainId.AVALANCHE]: "0x3059bbb4a86a502b7c2a838a4a87baf680887c04",
};

export const CLAIM_LAND_HERO_CONTRACT = {
  [ChainId.FUJI]: "0x083f5D926c3D1fbC61406A5795542E79Fbce04c0",
  [ChainId.AVALANCHE]: "0xce0918fFaac97e468af737B64cAD444B6caA024b",
};

async function main() {
  const [deployer, gameEmissionsFund] = await ethers.getSigners();

  const StakeLands = await ethers.getContractFactory("StakeLands");
  const stakeLands = StakeLands.attach(STAKE_LANDS[currentChain]);

  const Resource = await ethers.getContractFactory("Resource");

  const wood = Resource.attach(WOOD[currentChain].address);
  // await wood.connect(deployer).addManager(stakeLands.address);

  const wheat = Resource.attach(WHEAT[currentChain].address);
  // await wheat.connect(deployer).addManager(stakeLands.address);

  const stone = Resource.attach(STONE[currentChain].address);
  // await stone.connect(deployer).addManager(stakeLands.address);

  const iron = Resource.attach(IRON[currentChain].address);
  // await iron.connect(deployer).addManager(stakeLands.address);

  // await stakeLands.setResource("iron", iron.address);
  // await stakeLands.setResource("wood", wood.address);
  // await stakeLands.setResource("wheat", wheat.address);
  // await stakeLands.setResource("stone", stone.address);
  // await stakeLands.setResource("radi", RADI[currentChain].address);

  // await stakeLands.setResourceRecipientWallet(
  //   GAME_EMISSIONS_FUND[currentChain]
  // );
  // await stakeLands.setRadiReserveOwner(GAME_EMISSIONS_FUND[currentChain]);
  // await stakeLands.addLandCollection(CLAIM_LAND_HERO_CONTRACT[currentChain]);

  const Radi = await ethers.getContractFactory("Radi");
  // const radi = await Radi.attach(RADI[currentChain].address);

  // allowances for level up
  // await wood
  //   .connect(deployer)
  //   .approve(stakeLands.address, ethers.constants.MaxUint256);
  // await wheat
  //   .connect(deployer)
  //   .approve(stakeLands.address, ethers.constants.MaxUint256);
  // await iron
  //   .connect(deployer)
  //   .approve(stakeLands.address, ethers.constants.MaxUint256);
  // await stone
  //   .connect(deployer)
  //   .approve(stakeLands.address, ethers.constants.MaxUint256);
  // await radi
  //   .connect(deployer)
  //   .approve(stakeLands.address, ethers.constants.MaxUint256);

  // allowances for resource harvesting
  // await radi
  //   .connect(gameEmissionsFund)
  //   .approve(stakeLands.address, ethers.constants.MaxUint256);

  // set v1 and v2
  // await stakeLands.setV1(STAKING_LAND_V1[currentChain]);
  // await stakeLands.setV2(STAKING_LAND_V2[currentChain]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

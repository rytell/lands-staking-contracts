// @ts-nocheck
import { ethers } from "hardhat";
import { ChainId, Token } from "@rytell/sdk";

// eslint-disable-next-line no-unused-vars
const STAKE_LANDS: { [chainId in ChainId]: string } = {
  [ChainId.FUJI]: "0xA49117a4815fb484934B1A9Dbbb9F839515E79f4", // v3
  [ChainId.AVALANCHE]: "0x0000000000000000000000000000000000000000",
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
    "0x0000000000000000000000000000000000000000",
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
    "0x0000000000000000000000000000000000000000",
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
    "0x0000000000000000000000000000000000000000",
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
    "0x0000000000000000000000000000000000000000",
    18,
    "RIORE",
    "Rytell Iron Ore"
  ),
};

const currentChain = ChainId.FUJI;

export const GAME_EMISSIONS_FUND = {
  [ChainId.FUJI]: "0x3059bbb4a86a502b7c2a838a4a87baf680887c04",
  [ChainId.AVALANCHE]: "0x3059bbb4a86a502b7c2a838a4a87baf680887c04",
};

async function main() {
  const [deployer, gameEmissionsFund] = await ethers.getSigners();

  const StakeLands = await ethers.getContractFactory("StakeLands");
  const stakeLands = StakeLands.attach(STAKE_LANDS[currentChain]);

  // await stakeLands.setResource("radi", RADI[currentChain].address);

  const Resource = await ethers.getContractFactory("Resource");

  const wood = Resource.attach(WOOD[currentChain].address);
  // await wood.connect(gameEmissionsFund).addManager(stakeLands.address);
  // await stakeLands.setResource("wood", wood.address);

  const wheat = Resource.attach(WHEAT[currentChain].address);
  // await wheat.connect(gameEmissionsFund).addManager(stakeLands.address);
  // await stakeLands.setResource("wheat", wheat.address);

  const stone = Resource.attach(STONE[currentChain].address);
  // await stone.connect(gameEmissionsFund).addManager(stakeLands.address);
  // await stakeLands.setResource("stone", stone.address);

  const iron = Resource.attach(IRON[currentChain].address);
  // await iron.connect(gameEmissionsFund).addManager(stakeLands.address);
  // await stakeLands.setResource("iron", iron.address);

  // await stakeLands.setResourceRecipientWallet(
  //   GAME_EMISSIONS_FUND[currentChain]
  // );
  // await stakeLands.setRadiReserveOwner(GAME_EMISSIONS_FUND[currentChain]);

  const Radi = await ethers.getContractFactory("Radi");
  const radi = await Radi.attach(RADI[currentChain].address);

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
  await radi
    .connect(deployer)
    .approve(stakeLands.address, ethers.constants.MaxUint256);

  // allowances for resource harvesting
  // await wood
  //   .connect(gameEmissionsFund)
  //   .approve(stakeLands.address, ethers.constants.MaxUint256);
  // await wheat
  //   .connect(gameEmissionsFund)
  //   .approve(stakeLands.address, ethers.constants.MaxUint256);
  // await iron
  //   .connect(gameEmissionsFund)
  //   .approve(stakeLands.address, ethers.constants.MaxUint256);
  // await stone
  //   .connect(gameEmissionsFund)
  //   .approve(stakeLands.address, ethers.constants.MaxUint256);
  await radi
    .connect(gameEmissionsFund)
    .approve(stakeLands.address, ethers.constants.MaxUint256);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

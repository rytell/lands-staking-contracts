// @ts-nocheck
import { ethers } from "hardhat";
import { ChainId } from "@rytell/sdk";

// eslint-disable-next-line no-unused-vars
const HEROS: { [chainId in ChainId]: string } = {
  [ChainId.FUJI]: "0x6122F8cCFC196Eb2689a740d16c451a352740194",
  [ChainId.AVALANCHE]: "0x0ca68D5768BECA6FCF444C01FE1fb6d47C019b9f",
};

async function main() {
  const StakeLands = await ethers.getContractFactory("StakeLands");
  const stakeLands = await StakeLands.deploy(HEROS[ChainId.FUJI]);
  await stakeLands.deployed();
  console.log("stake lands: ", stakeLands.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

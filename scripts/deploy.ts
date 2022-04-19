import { ethers } from "hardhat";

async function main() {
  const StakeLands = await ethers.getContractFactory("StakeLands");
  const stakeLands = await StakeLands.deploy("","");

  await stakeLands.deployed();

  console.log("Greeter deployed to:", stakeLands.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

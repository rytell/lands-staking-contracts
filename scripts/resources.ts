// @ts-nocheck
import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();
  const Resource = await ethers.getContractFactory("Resource");

  const wood = await Resource.deploy(
    owner.address,
    "Rytell Wooden Plank",
    "RWPLK"
  );
  await wood.deployed();

  const wheat = await Resource.deploy(owner.address, "Rytell Wheat", "RWHT");
  await wheat.deployed();

  const stone = await Resource.deploy(
    owner.address,
    "Rytell Stone Block",
    "RSBLK"
  );
  await stone.deployed();

  const iron = await Resource.deploy(owner.address, "Rytell Iron Ore", "RIORE");
  await iron.deployed();

  console.log("wood: ", wood.address);
  console.log("iron: ", iron.address);
  console.log("wheat: ", wheat.address);
  console.log("stone: ", stone.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

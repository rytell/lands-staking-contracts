import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";

describe("Rytell Resources", function () {
  let owner: SignerWithAddress;
  let accounts: SignerWithAddress[];
  let heros: Contract;
  let stakeLands: Contract;
  let wood: Contract;
  this.beforeEach(async function () {
    [owner, ...accounts] = await ethers.getSigners();

    const Resource = await ethers.getContractFactory("Resource");

    wood = await Resource.deploy(owner.address, "Rytell Wooden Plank", "RWPLK");
    await wood.deployed();

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

    await wood.addManager(stakeLands.address);
  });

  it("Should compile", async function () {
    expect(true).to.equal(true);
  });

  it("Should let owner remove manager contracts after deployment", async function () {
    expect(await wood.managersSize()).to.equal(2);

    await expect(wood.removeManager(stakeLands.address)).not.to.be.reverted;

    expect(await wood.managersSize()).to.equal(1);
  });

  it("manager should be able to mint", async function () {
    await expect(wood.mint(accounts[0].address, 1000)).not.to.be.reverted;
    expect(await wood.balanceOf(accounts[0].address)).to.equal(1000);
  });
});

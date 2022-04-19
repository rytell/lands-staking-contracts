import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

describe("Stake Lands", function () {
  let owner: SignerWithAddress;
  let stakers: SignerWithAddress[];
  let landCollectionOne: Contract;

  this.beforeEach(async function () {
    [owner, ...stakers] = await ethers.getSigners();

    const LandCollection = await ethers.getContractFactory("ERC721");
    landCollectionOne = await LandCollection.deploy(
      "The lands of Rytell",
      "TLOR"
    );
    await landCollectionOne.deployed();

    // const ClaimableCollection = await ethers.getContractFactory(
    //   "ClaimableCollection"
    // );
    // claimableCollection = await ClaimableCollection.deploy(
    //   "ipfs://QmUWjzWH8BasGqyH7tPBiscas1q1Lp8hsqwtVxiUuEhWRZ/",
    //   baseCollection.address
    // );
    // await claimableCollection.deployed();
    // await claimableCollection.setPaused(false);
  });

  it("Should compile", async function () {
    console.log("owner: ", owner);
    console.log("stakers: ", stakers.length);
    expect(true).to.equal(true);
  });
});

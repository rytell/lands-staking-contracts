// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestRadi is ERC20("TestRadi", "TRADI") {
  constructor(
    uint256 amount,
    address supplyHolder
  ) {
    _mint(supplyHolder, amount);
  }
}

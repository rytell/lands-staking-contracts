// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestUsdc is ERC20("TestUsdc", "TUSDC") {
  constructor(uint256 amount, address supplyHolder) {
    _mint(supplyHolder, amount);
  }

  function decimals() public view virtual override returns (uint8) {
    return 6;
  }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract Radi is ERC20("RADI", "RADI") {
  address private manager;

  constructor(uint256 _totalSupply, address _manager) {
    manager = _manager;
    _mint(_manager, _totalSupply);
  }

  // Burns the callers tokens
  function burnOwnTokens(uint256 _amount) external {
    _burn(msg.sender, _amount);
  }
}

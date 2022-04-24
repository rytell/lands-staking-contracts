// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract Resource is ERC20 {
  address private manager;

  constructor(address _manager, string memory name, string memory symbol) ERC20(name, symbol) {
    manager = _manager;
  }

  // Burns the callers tokens
  function burnOwnTokens(uint256 _amount) external {
    _burn(msg.sender, _amount);
  }
}

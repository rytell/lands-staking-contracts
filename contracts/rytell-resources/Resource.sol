// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Resource is ERC20, Ownable {
    address[] private managers;

    constructor(
        address _manager,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        managers.push(_manager);
    }

    event AddedManager(address manager, address who, uint256 when);
    event RemovedManager(address manager, address who, uint256 when);

    function addManager(address manager) public onlyOwner {
        managers.push(manager);
        emit AddedManager(manager, msg.sender, block.timestamp);
    }

    function managersSize() public view returns (uint256) {
      return managers.length;
    }

    function removeManager(address manager) public onlyOwner {
        for (uint256 index = 0; index < managers.length; index++) {
            if (managers[index] == manager) {
                managers[index] = managers[
                    managers.length - 1
                ];
                managers.pop();
                emit RemovedManager(manager, msg.sender, block.timestamp);
            }
        }
    }

    function mint(address account, uint256 amount) public {
        for (uint256 index = 0; index < managers.length; index++) {
            if (managers[index] == msg.sender) {
                _mint(account, amount);
            }
        }
    }

    function burnOwnTokens(uint256 _amount) external {
        _burn(msg.sender, _amount);
    }
}

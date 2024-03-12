// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
/// @title Interface for making arbitrary calls during swap
interface IAggregationExecutor {
    /// @notice propagates information about original msg.sender and executes arbitrary data
    function callBytes(IERC20 fromToken,
                       IERC20 toToken,
                       uint256 amount,
                       uint256[] memory distribution) external payable;  // 0x4b64e492
}



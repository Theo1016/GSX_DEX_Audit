// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

interface IRewardRouterV2 {
    function feeGspTracker() external view returns (address);
    function stakedGspTracker() external view returns (address);
}

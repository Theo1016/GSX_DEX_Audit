// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

/// @title The interface for the PancakeSwap V3 Factory
/// @notice The PancakeSwap V3 Factory facilitates creation of PancakeSwap V3 pools and control over the protocol fees
interface IPancakeV3Factory {


    /// @return pool The pool address
    function getPool(
        address tokenA,
        address tokenB,
        uint24 fee
    ) external view returns (address pool);

}   
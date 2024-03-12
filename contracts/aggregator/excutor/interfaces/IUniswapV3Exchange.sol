// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IUniswapV3Exchange {

    struct Slot0 {
        uint160 sqrtPriceX96;
        int24 tick;
        uint16 observationIndex;
        uint16 observationCardinality;
        uint16 observationCardinalityNext;
        bool unlocked;
        uint8 feeProtocol;
    }

    function slot0() external view returns (Slot0 memory);

    function swap(
            address recipient,
            bool zeroForOne,
            int256 amountSpecified,
            uint160 sqrtPriceLimitX96,
            bytes calldata data
        ) external returns (int256 amount0, int256 amount1);

}

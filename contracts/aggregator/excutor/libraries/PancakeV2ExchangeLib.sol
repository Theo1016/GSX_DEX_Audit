// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../UniversalERC20.sol";
import "../interfaces/IPancakePair.sol";

library PancakeV2ExchangeLib {
    using SafeMath for uint256;
    using UniversalERC20 for IERC20;

    // function getReturn(
    //     IPancakePair exchange,
    //     IERC20 fromToken,
    //     IERC20 toToken,
    //     uint amountIn
    // ) internal view returns (uint256) {
    //     uint256 reserveIn = fromToken.universalBalanceOf(address(exchange));
    //     uint256 reserveOut = toToken.universalBalanceOf(address(exchange));

    //     uint256 amountInWithFee = amountIn.mul(9975);
    //     uint256 numerator = amountInWithFee.mul(reserveOut);
    //     uint256 denominator = reserveIn.mul(10000).add(amountInWithFee);
    //     return (denominator == 0) ? 0 : numerator.div(denominator);
    // }

    function getReturn(
        IPancakePair exchange,
        IERC20 fromToken,
        IERC20 toToken,
        uint amountIn,
        uint _numerator,
        uint _denominator
    ) internal view returns (uint256) {
        uint256 reserveIn = fromToken.universalBalanceOf(address(exchange));
        uint256 reserveOut = toToken.universalBalanceOf(address(exchange));

        uint256 amountInWithFee = amountIn.mul(_numerator);
        uint256 numerator = amountInWithFee.mul(reserveOut);
        uint256 denominator = reserveIn.mul(_denominator).add(amountInWithFee);
        return (denominator == 0) ? 0 : numerator.div(denominator);
    }
}
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./ExecutorRoot.sol"; 
import "./UniversalERC20.sol";
import "./interfaces/IWETH.sol";
import "./interfaces/IPancakePair.sol";
import "./interfaces/IUniswapV3Exchange.sol";
import "./interfaces/IPancakeV3Pool.sol";
import "./libraries/PancakeV2ExchangeLib.sol";

contract AggregationExecutor is ExecutorRoot {
      using UniversalERC20 for IERC20;
      using SafeMath for uint256;
      using PancakeV2ExchangeLib for IPancakePair;

      IWETH constant public weth = IWETH(0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c); // bsc Weth
    //   IWETH constant public weth = IWETH(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2); // eth Weth

    //   uint256 constant public DEXES_COUNT = 14;
      uint256 constant public DEXES_COUNT = 7;


      struct Slot0 {
        uint160 sqrtPriceX96;
        int24 tick;
        uint16 observationIndex;
        uint16 observationCardinality;
        uint16 observationCardinalityNext;
        uint8 feeProtocol;
        bool unlocked;
    }

    function callBytes(
        IERC20 fromToken,
        IERC20 toToken,
        uint256 amount,
        uint256[] memory distribution
    ) public payable {
        if (fromToken == toToken) {
            return;
        }

        function(IERC20, IERC20, uint256) [DEXES_COUNT] memory reserves = [
            _swapOnPancakeV2swap,
            _swapOnPancakeV2Oswap,
            _swapOnApeSwap,
            _swapOnBakerySwap,
            _swapOnBSCswap,
            _swapOnThugswap,
            _swapOnWaultSwap
            // _swapOnUniV3swap500,
            // _swapOnUniV3swap3000,
            // _swapOnUniV3swap10000,
            // _swapOnPancakeV3swap100,
            // _swapOnPancakeV3swap500,
            // _swapOnPancakeV3swap2500,
            // _swapOnPancakeV3swap10000
        ];
        require(distribution.length <= reserves.length, "GsxSplit: Distribution array should not exceed reserves array size");

        uint256 parts = 0;
        uint256 lastNonZeroIndex = 0;

        for (uint i = 0; i < distribution.length; i++) {
            if (distribution[i] > 0) {
                parts = parts.add(distribution[i]);
                lastNonZeroIndex = i;
            }
        }

        require(parts > 0, "GsxSplit: distribution should contain non-zeros");

        uint256 remainingAmount = amount;

        for (uint i = 0; i < distribution.length; i++) {
            if (distribution[i] == 0) {
                continue;
            }

            uint256 swapAmount = amount.mul(distribution[i]).div(parts);

            if (i == lastNonZeroIndex) {
                swapAmount = remainingAmount;
            }

            remainingAmount -= swapAmount;
            reserves[i](fromToken, toToken, swapAmount);
        }
    }
    
    // ======= pancakeV2

    function _swapOnPancakeV2swap(
        IERC20 fromToken,
        IERC20 destToken,
        uint256 amount
    ) internal{
        if (fromToken.isETH()) {
            weth.deposit{value: amount}();
        }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

        IERC20 fromTokenReal = fromToken.isETH() ? weth : fromToken;
        IERC20 toTokenReal = destToken.isETH() ? weth : destToken;
        IPancakePair exchange = IPancakePair(PancakeFactory.getPair(address(fromTokenReal), address(toTokenReal)));
        _swapLikeUniswapV2(fromToken, destToken, amount, 9975, 10000, exchange);

         if (destToken.isETH()) {
            weth.withdraw(weth.balanceOf(msg.sender));
        }
    }

    function _swapOnPancakeV2Oswap(
        IERC20 fromToken,
        IERC20 destToken,
        uint256 amount
    ) internal{
        if (fromToken.isETH()) {
            weth.deposit{value: amount}();
        }

        IERC20 fromTokenReal = fromToken.isETH() ? weth : fromToken;
        IERC20 toTokenReal = destToken.isETH() ? weth : destToken;
        IPancakePair exchange = IPancakePair(PancakeFactoryO.getPair(address(fromTokenReal), address(toTokenReal)));
        _swapLikeUniswapV2(fromToken, destToken, amount, 998, 1000, exchange);

         if (destToken.isETH()) {
            weth.withdraw(weth.balanceOf(msg.sender));
        }
    }

    function _swapOnApeSwap(
        IERC20 fromToken,
        IERC20 destToken,
        uint256 amount
    ) internal{
        if (fromToken.isETH()) {
            weth.deposit{value: amount}();
        }

        IERC20 fromTokenReal = fromToken.isETH() ? weth : fromToken;
        IERC20 toTokenReal = destToken.isETH() ? weth : destToken;
        IPancakePair exchange = IPancakePair(ApeFactory.getPair(address(fromTokenReal), address(toTokenReal)));
        _swapLikeUniswapV2(fromToken, destToken, amount, 998, 1000, exchange);
        if (destToken.isETH()) {
            weth.withdraw(weth.balanceOf(msg.sender));
        }
    }

     function _swapOnBakerySwap(
        IERC20 fromToken,
        IERC20 destToken,
        uint256 amount
    ) internal{
        if (fromToken.isETH()) {
            weth.deposit{value: amount}();
        }
        IERC20 fromTokenReal = fromToken.isETH() ? weth : fromToken;
        IERC20 toTokenReal = destToken.isETH() ? weth : destToken;
        IPancakePair exchange = IPancakePair(BakerySwapFactory.getPair(address(fromTokenReal), address(toTokenReal)));
        _swapLikeUniswapV2(fromToken, destToken, amount, 997, 1000, exchange);
        if (destToken.isETH()) {
            weth.withdraw(weth.balanceOf(msg.sender));
        }
    }


    function _swapOnBSCswap(
        IERC20 fromToken,
        IERC20 destToken,
        uint256 amount
    ) internal{
        if (fromToken.isETH()) {
            weth.deposit{value: amount}();
        }
        IERC20 fromTokenReal = fromToken.isETH() ? weth : fromToken;
        IERC20 toTokenReal = destToken.isETH() ? weth : destToken;
        IPancakePair exchange = IPancakePair(BSCswapFactory.getPair(address(fromTokenReal), address(toTokenReal)));
        _swapLikeUniswapV2(fromToken, destToken, amount, 997, 1000, exchange);
        if (destToken.isETH()) {
            weth.withdraw(weth.balanceOf(msg.sender));
        }
    }
    
    function _swapOnWaultSwap(
        IERC20 fromToken,
        IERC20 destToken,
        uint256 amount
    ) internal{
        if (fromToken.isETH()) {
            weth.deposit{value: amount}();
        }
        IERC20 fromTokenReal = fromToken.isETH() ? weth : fromToken;
        IERC20 toTokenReal = destToken.isETH() ? weth : destToken;
        IPancakePair exchange = IPancakePair(WaultSwapFactory.getPair(address(fromTokenReal), address(toTokenReal)));
        _swapLikeUniswapV2(fromToken, destToken, amount, 998, 1000, exchange);
        if (destToken.isETH()) {
            weth.withdraw(weth.balanceOf(msg.sender));
        }
    }

     function _swapOnThugswap(
        IERC20 fromToken,
        IERC20 destToken,
        uint256 amount
    ) internal{
        if (fromToken.isETH()) {
            weth.deposit{value: amount}();
        }
        IERC20 fromTokenReal = fromToken.isETH() ? weth : fromToken;
        IERC20 toTokenReal = destToken.isETH() ? weth : destToken;
        IPancakePair exchange = IPancakePair(ThugswapFactory.getPair(address(fromTokenReal), address(toTokenReal)));
        _swapLikeUniswapV2(fromToken, destToken, amount, 997, 1000, exchange);
        if (destToken.isETH()) {
            weth.withdraw(weth.balanceOf(msg.sender));
        }
    }
    
    function _swapLikeUniswapV2(
        IERC20 fromTokenReal,
        IERC20 toTokenReal,
        uint256 amount,
        uint _numerator,
        uint _denominator,
        IPancakePair _exchange
    ) internal {
        uint returnAmount = uint(_exchange.getReturn(fromTokenReal, toTokenReal, amount, 9975, 10000));

        fromTokenReal.universalTransfer(address(_exchange), amount);

        // 如果 目标token = token1
        if (fromTokenReal < toTokenReal) {
            _exchange.swap(0, returnAmount, msg.sender, "");
        } else {
            _exchange.swap(returnAmount, 0, msg.sender, "");
        }
  
    }

    // ======= pancakeV3
    // function _swapOnPancakeV3swap100(
    //     IERC20 fromToken,
    //     IERC20 destToken,
    //     uint256 amount
    // ) internal{
    //     _swapOnLikeUniV3swap(fromToken, destToken, amount, 100);
    // }

    // function _swapOnPancakeV3swap500(
    //     IERC20 fromToken,
    //     IERC20 destToken,
    //     uint256 amount
    // ) internal {
    //     _swapOnLikeUniV3swap(fromToken, destToken, amount, 500);
    // }

    // function _swapOnPancakeV3swap2500(
    //     IERC20 fromToken,
    //     IERC20 destToken,
    //     uint256 amount
    // ) internal {
    //     _swapOnLikeUniV3swap(fromToken, destToken, amount, 2500);
    // }

    // function _swapOnPancakeV3swap10000(
    //     IERC20 fromToken,
    //     IERC20 destToken,
    //     uint256 amount
    // ) internal {
    //     _swapOnLikeUniV3swap(fromToken, destToken, amount, 10000);
    // }

    

    // function _swapOnUniV3swap500(
    //     IERC20 fromToken,
    //     IERC20 destToken,
    //     uint256 amount
    // ) internal {
    //     _swapOnLikeUniV3swap(fromToken, destToken, amount, 500);
    // }

    // function _swapOnUniV3swap3000(
    //     IERC20 fromToken,
    //     IERC20 destToken,
    //     uint256 amount
    // ) internal{
    //     _swapOnLikeUniV3swap(fromToken, destToken, amount, 500);
    // }

    // function _swapOnUniV3swap10000(
    //     IERC20 fromToken,
    //     IERC20 destToken,
    //     uint256 amount
    // ) internal {
    //     _swapOnLikeUniV3swap(fromToken, destToken, amount, 500);
    // }

 
    // function _swapOnLikeUniV3swap(
    //     IERC20 fromToken,
    //     IERC20 destToken,
    //     uint256 amount,
    //     uint24 fee
    // ) internal {
    //     if (fromToken.isETH()) {
    //         weth.deposit{value: amount}();
    //     }

    //     uint256 deadline = block.timestamp + 15; 
    //     ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams(
    //         fromToken.isETH() ? address(weth) : address(fromToken),
    //         destToken.isETH() ? address(weth) : address(destToken),
    //         fee,
    //         msg.sender,
    //         deadline,
    //         amount,
    //         1,
    //         0
    //     );

    //     uniswapV3Router.exactInputSingle{ value: msg.value }(params);

    //     if (destToken.isETH()) {
    //         weth.withdraw(weth.balanceOf(msg.sender));
    //     }
    // } 

    receive() payable external {}

}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

library UniversalERC20 {
    using SafeERC20 for IERC20;

    IERC20 private constant ZERO_ADDRESS = IERC20(0x0000000000000000000000000000000000000000);
    IERC20 private constant ETH_ADDRESS = IERC20(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    IERC20 private constant _WETH = IERC20(0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c); // bsc weth
    
    // IERC20 private constant _WETH = IERC20(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2); // eth weth


    function isETH(IERC20 token) internal pure returns(bool) {
        return (address(token) == address(ZERO_ADDRESS) || address(token) == address(ETH_ADDRESS));
    }

    function isWETH(IERC20 token) internal pure returns(bool) {
        return (address(token) == address(ZERO_ADDRESS) || address(token) == address(_WETH));
    }

    function universalBalanceOf(IERC20 token, address who) internal view returns (uint256) {
        if (isETH(token)) {
            return who.balance;
        } else {
            return token.balanceOf(who);
        }
    }

    function universalTransfer(IERC20 token, address to, uint256 amount) internal returns(bool) {
        if (amount == 0) {
            return true;
        }

        if (isETH(token)) {
             (bool success, bytes memory result) = address(to).call{value: msg.value}("");
            // 如果调用失败，则回滚并显示错误消息
            if (!success) {
                revert("call failed");
            }
            return true;
        } else {
            token.safeTransfer(to, amount);
            return true;
        }
    }
}
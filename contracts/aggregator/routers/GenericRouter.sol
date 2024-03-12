// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "../utils/EthReceiver.sol";
import "../utils/libraries/UniERC20.sol";
import "../interfaces/IAggregationExecutor.sol";
import "../helpers/RouterErrors.sol";
import "../helpers/RevertReasonParser.sol";

contract GenericRouter is EthReceiver {
    using UniERC20 for IERC20;
    using SafeERC20 for IERC20;

    error ZeroMinReturn();
    error ZeroReturnAmount();

    uint256 private constant _PARTIAL_FILL = 1 << 0;
    uint256 private constant _REQUIRES_EXTRA_ETH = 1 << 1;

    struct SwapDescription {
        IERC20 srcToken;
        IERC20 dstToken;
        address payable srcReceiver;
        address payable dstReceiver;
        uint256 amount;
        uint256 minReturnAmount;
        uint256 flags;
    }

    function swap(
        IAggregationExecutor caller,
        SwapDescription calldata desc,
        bytes calldata permit,
        uint256[] memory data
    )
        external
        payable
        returns (
            uint256 returnAmount,
            uint256 spentAmount
        )
    {   
        if (desc.minReturnAmount == 0) revert ZeroMinReturn();

        IERC20 srcToken = desc.srcToken;
        IERC20 dstToken = desc.dstToken;

        bool srcETH = srcToken.isETH();

        if (desc.flags & _REQUIRES_EXTRA_ETH != 0) {
            if (msg.value <= (srcETH ? desc.amount : 0)) revert RouterErrors.InvalidMsgValue();
        } else {
            if (msg.value != (srcETH ? desc.amount : 0)) revert RouterErrors.InvalidMsgValue();
        }

        if (!srcETH) {
            if (permit.length > 0) {
                srcToken.safePermit(permit);
            }
            srcToken.safeTransferFrom(msg.sender, desc.srcReceiver, desc.amount);
        }

        // bytes memory callData = abi.encodePacked(caller.callBytes.selector, bytes12(0), msg.sender, data);
        bytes memory callData = abi.encodeWithSignature("callBytes(address,address,uint256,uint256[])", desc.srcToken, desc.dstToken, desc.amount, data);

        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory result) = address(caller).call{value: msg.value}(callData);
        if (!success) {
            revert(RevertReasonParser.parse(result, "callBytes failed: "));
        }

        spentAmount = desc.amount;
        returnAmount = dstToken.uniBalanceOf(address(this));  

        if (returnAmount == 0) revert ZeroReturnAmount();
        unchecked { returnAmount--; }

        if (desc.flags & _PARTIAL_FILL != 0) {
            uint256 unspentAmount = srcToken.uniBalanceOf(address(this));
            if (unspentAmount > 1) {
                // we leave 1 wei on the router for gas optimisations reasons
                unchecked { unspentAmount--; }
                spentAmount -= unspentAmount;
                srcToken.uniTransfer(payable(msg.sender), unspentAmount);
            }
            if (returnAmount * desc.amount < desc.minReturnAmount * spentAmount) revert RouterErrors.ReturnAmountIsNotEnough();
        } else {
            if (returnAmount < desc.minReturnAmount) revert RouterErrors.ReturnAmountIsNotEnough();
        }

        address payable dstReceiver = (desc.dstReceiver == address(0)) ? payable(msg.sender) : desc.dstReceiver;
        dstToken.uniTransfer(dstReceiver, returnAmount);
        uint256 owerBalance = srcToken.uniBalanceOf(msg.sender);
    }
}
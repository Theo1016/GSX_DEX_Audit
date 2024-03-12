// File @1inch/solidity-utils/contracts/interfaces/IDaiLikePermit.sol@v2.1.1


pragma solidity ^0.8.0;


interface IDaiLikePermit {
    function permit(address holder, address spender, uint256 nonce, uint256 expiry, bool allowed, uint8 v, bytes32 r, bytes32 s) external;
}


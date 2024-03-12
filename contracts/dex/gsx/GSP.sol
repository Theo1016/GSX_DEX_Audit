// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../tokens/MintableBaseToken.sol";

contract GSP is MintableBaseToken {
    constructor() public MintableBaseToken("GSX LP", "GSP", 0) {
    }

    function id() external pure returns (string memory _name) {
        return "GSP";
    }
}

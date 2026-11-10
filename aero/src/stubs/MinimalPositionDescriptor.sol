// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;

/// @notice No-op NFT descriptor; tokenURI is unused for swap/LP scripting.
contract MinimalPositionDescriptor {
    function tokenURI(address, uint256) external pure returns (string memory) {
        return "";
    }
}

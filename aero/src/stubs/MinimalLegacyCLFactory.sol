// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;

/// @notice Stub legacy factory: always reports no existing pool so createPool is unrestricted.
contract MinimalLegacyCLFactory {
    function getPool(address, address, int24) external pure returns (address) {
        return address(0);
    }
}

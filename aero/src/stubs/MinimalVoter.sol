// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;

/// @notice Minimal voter stub required by CLFactory constructor (reads factoryRegistry).
/// getUnstakedFee also calls gauges/isAlive; returning zero/false keeps unstaked fee at 0.
contract MinimalVoter {
    address public immutable factoryRegistry;

    constructor(address factoryRegistry_) {
        factoryRegistry = factoryRegistry_;
    }

    function gauges(address) external pure returns (address) {
        return address(0);
    }

    function isAlive(address) external pure returns (bool) {
        return false;
    }
}

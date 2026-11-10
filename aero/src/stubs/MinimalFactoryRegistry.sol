// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;

/// @notice Stub registry so CLFactory can construct without full Aerodrome governance.
contract MinimalFactoryRegistry {
    function approve(address, address, address) external {}

    function isPoolFactoryApproved(address) external pure returns (bool) {
        return true;
    }

    function factoriesToPoolFactory(address)
        external
        pure
        returns (address votingRewardsFactory, address gaugeFactory)
    {
        return (address(0), address(0));
    }
}

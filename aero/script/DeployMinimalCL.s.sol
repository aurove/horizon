// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;
pragma abicoder v2;

import "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

import {CLPool} from "contracts/core/CLPool.sol";
import {CLFactory} from "contracts/core/CLFactory.sol";
import {NonfungiblePositionManager} from "contracts/periphery/NonfungiblePositionManager.sol";
import {QuoterV2} from "contracts/periphery/lens/QuoterV2.sol";
import {SwapRouter} from "contracts/periphery/SwapRouter.sol";

import {MinimalFactoryRegistry} from "../src/stubs/MinimalFactoryRegistry.sol";
import {MinimalLegacyCLFactory} from "../src/stubs/MinimalLegacyCLFactory.sol";
import {MinimalVoter} from "../src/stubs/MinimalVoter.sol";
import {MinimalPositionDescriptor} from "../src/stubs/MinimalPositionDescriptor.sol";

/// @notice Wave-2 minimal Slipstream: stubs + CLPool/CLFactory + NPM + SwapRouter + QuoterV2.
/// Tick spacing 200 (fee 3000) is enabled by CLFactory's constructor.
contract DeployMinimalCL is Script {
    address public constant WETH = 0x4200000000000000000000000000000000000006;
    int24 public constant DEFAULT_TICK_SPACING = 200;

    function run() public {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.rememberKey(pk);

        string memory outPath = vm.envOr("AERO_ADDRESSES_OUT", string("deployments/baseSepolia/addresses.json"));

        vm.startBroadcast(deployer);

        MinimalFactoryRegistry registry = new MinimalFactoryRegistry();
        MinimalLegacyCLFactory legacyFactory = new MinimalLegacyCLFactory();
        MinimalVoter voter = new MinimalVoter(address(registry));
        MinimalPositionDescriptor descriptor = new MinimalPositionDescriptor();

        CLPool poolImplementation = new CLPool();
        CLFactory poolFactory = new CLFactory({
            _voter: address(voter),
            _clFactory: address(legacyFactory),
            _poolImplementation: address(poolImplementation)
        });

        NonfungiblePositionManager npm = new NonfungiblePositionManager({
            _factory: address(poolFactory),
            _WETH9: WETH,
            _tokenDescriptor: address(descriptor),
            name: "Horizon Slipstream Positions",
            symbol: "HZN-CL-POS"
        });

        SwapRouter swapRouter = new SwapRouter({_factory: address(poolFactory), _WETH9: WETH});
        QuoterV2 quoter = new QuoterV2({_factory: address(poolFactory), _WETH9: WETH});

        vm.stopBroadcast();

        string memory obj = "deployment";
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        vm.serializeUint(obj, "chainId", chainId);
        vm.serializeBool(obj, "deployed", true);
        vm.serializeString(obj, "network", "baseSepolia");
        vm.serializeAddress(obj, "deployer", deployer);
        vm.serializeAddress(obj, "WETH", WETH);
        vm.serializeAddress(obj, "MinimalFactoryRegistry", address(registry));
        vm.serializeAddress(obj, "MinimalLegacyCLFactory", address(legacyFactory));
        vm.serializeAddress(obj, "MinimalVoter", address(voter));
        vm.serializeAddress(obj, "MinimalPositionDescriptor", address(descriptor));
        vm.serializeAddress(obj, "PoolImplementation", address(poolImplementation));
        vm.serializeAddress(obj, "PoolFactory", address(poolFactory));
        vm.serializeAddress(obj, "NonfungiblePositionManager", address(npm));
        vm.serializeAddress(obj, "SwapRouter", address(swapRouter));
        vm.serializeAddress(obj, "QuoterV2", address(quoter));
        vm.serializeInt(obj, "defaultTickSpacing", int256(DEFAULT_TICK_SPACING));
        string memory json = vm.serializeString(
            obj,
            "note",
            "Minimal Slipstream (no gauges/veAERO). Tick spacing 200 enabled in CLFactory ctor."
        );

        vm.writeJson(json, outPath);

        console.log("PoolFactory", address(poolFactory));
        console.log("NonfungiblePositionManager", address(npm));
        console.log("SwapRouter", address(swapRouter));
        console.log("QuoterV2", address(quoter));
        console.log("defaultTickSpacing", uint256(DEFAULT_TICK_SPACING));
        console.log("wrote", outPath);
    }
}

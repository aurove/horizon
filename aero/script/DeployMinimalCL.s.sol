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

    struct Deployed {
        address registry;
        address legacyFactory;
        address voter;
        address descriptor;
        address poolImplementation;
        address poolFactory;
        address npm;
        address swapRouter;
        address quoter;
    }

    function run() public {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.rememberKey(pk);
        string memory outPath = vm.envOr("AERO_ADDRESSES_OUT", string("deployments/baseSepolia/addresses.json"));
        // Only the TS --broadcast path sets this; simulation must not poison the address book.
        bool writeAddresses = vm.envOr("AERO_WRITE_ADDRESSES", false);

        Deployed memory d = _deploy(deployer);

        console.log("PoolFactory", d.poolFactory);
        console.log("NonfungiblePositionManager", d.npm);
        console.log("SwapRouter", d.swapRouter);
        console.log("QuoterV2", d.quoter);
        console.log("defaultTickSpacing", uint256(DEFAULT_TICK_SPACING));

        if (!writeAddresses) {
            console.log("skipping addresses.json write (set AERO_WRITE_ADDRESSES=1 to enable)");
            return;
        }

        _writeAddresses(outPath, deployer, d);
        console.log("wrote", outPath);
    }

    function _deploy(address deployer) internal returns (Deployed memory d) {
        vm.startBroadcast(deployer);

        d.registry = address(new MinimalFactoryRegistry());
        d.legacyFactory = address(new MinimalLegacyCLFactory());
        d.voter = address(new MinimalVoter(d.registry));
        d.descriptor = address(new MinimalPositionDescriptor());

        d.poolImplementation = address(new CLPool());
        d.poolFactory = address(
            new CLFactory({
                _voter: d.voter,
                _clFactory: d.legacyFactory,
                _poolImplementation: d.poolImplementation
            })
        );

        d.npm = address(
            new NonfungiblePositionManager({
                _factory: d.poolFactory,
                _WETH9: WETH,
                _tokenDescriptor: d.descriptor,
                name: "Horizon Slipstream Positions",
                symbol: "HZN-CL-POS"
            })
        );

        d.swapRouter = address(new SwapRouter({_factory: d.poolFactory, _WETH9: WETH}));
        d.quoter = address(new QuoterV2({_factory: d.poolFactory, _WETH9: WETH}));

        vm.stopBroadcast();
    }

    function _writeAddresses(string memory outPath, address deployer, Deployed memory d) internal {
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
        vm.serializeAddress(obj, "MinimalFactoryRegistry", d.registry);
        vm.serializeAddress(obj, "MinimalLegacyCLFactory", d.legacyFactory);
        vm.serializeAddress(obj, "MinimalVoter", d.voter);
        vm.serializeAddress(obj, "MinimalPositionDescriptor", d.descriptor);
        vm.serializeAddress(obj, "PoolImplementation", d.poolImplementation);
        vm.serializeAddress(obj, "PoolFactory", d.poolFactory);
        vm.serializeAddress(obj, "NonfungiblePositionManager", d.npm);
        vm.serializeAddress(obj, "SwapRouter", d.swapRouter);
        vm.serializeAddress(obj, "QuoterV2", d.quoter);
        vm.serializeInt(obj, "defaultTickSpacing", int256(DEFAULT_TICK_SPACING));
        string memory json = vm.serializeString(
            obj,
            "note",
            "Minimal Slipstream (no gauges/veAERO). Tick spacing 200 enabled in CLFactory ctor."
        );
        vm.writeJson(json, outPath);
    }
}

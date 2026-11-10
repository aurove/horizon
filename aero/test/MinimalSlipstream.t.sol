// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;
pragma abicoder v2;

import "forge-std/Test.sol";

import {CLPool} from "contracts/core/CLPool.sol";
import {CLFactory} from "contracts/core/CLFactory.sol";
import {NonfungiblePositionManager} from "contracts/periphery/NonfungiblePositionManager.sol";
import {INonfungiblePositionManager} from "contracts/periphery/interfaces/INonfungiblePositionManager.sol";
import {SwapRouter} from "contracts/periphery/SwapRouter.sol";
import {ISwapRouter} from "contracts/periphery/interfaces/ISwapRouter.sol";
import {TickMath} from "contracts/core/libraries/TickMath.sol";

import {MinimalFactoryRegistry} from "../src/stubs/MinimalFactoryRegistry.sol";
import {MinimalLegacyCLFactory} from "../src/stubs/MinimalLegacyCLFactory.sol";
import {MinimalVoter} from "../src/stubs/MinimalVoter.sol";
import {MinimalPositionDescriptor} from "../src/stubs/MinimalPositionDescriptor.sol";
import {MinimalERC20} from "../src/stubs/MinimalERC20.sol";

/// @notice createPool (via NPM.mint sqrtPriceX96!=0) → LP mint → exactInputSingle against stubs.
contract MinimalSlipstreamTest is Test {
    int24 internal constant TICK_SPACING = 200;
    uint160 internal constant SQRT_PRICE_1_1 = 79228162514264337593543950336; // TickMath.getSqrtRatioAtTick(0)

    MinimalERC20 internal tokenA;
    MinimalERC20 internal tokenB;
    address internal token0;
    address internal token1;

    CLFactory internal factory;
    NonfungiblePositionManager internal npm;
    SwapRouter internal router;

    function setUp() public {
        tokenA = new MinimalERC20("TokenA", "A", 0);
        tokenB = new MinimalERC20("TokenB", "B", 0);
        if (address(tokenA) < address(tokenB)) {
            token0 = address(tokenA);
            token1 = address(tokenB);
        } else {
            token0 = address(tokenB);
            token1 = address(tokenA);
        }

        MinimalFactoryRegistry registry = new MinimalFactoryRegistry();
        MinimalLegacyCLFactory legacyFactory = new MinimalLegacyCLFactory();
        MinimalVoter voter = new MinimalVoter(address(registry));
        MinimalPositionDescriptor descriptor = new MinimalPositionDescriptor();

        CLPool poolImplementation = new CLPool();
        factory = new CLFactory({
            _voter: address(voter),
            _clFactory: address(legacyFactory),
            _poolImplementation: address(poolImplementation)
        });

        // WETH unused in this test path (no ETH wraps); placeholder address for ctor.
        address weth = address(0x4200000000000000000000000000000000000006);

        npm = new NonfungiblePositionManager({
            _factory: address(factory),
            _WETH9: weth,
            _tokenDescriptor: address(descriptor),
            name: "Test CL Positions",
            symbol: "T-CL-POS"
        });
        router = new SwapRouter({_factory: address(factory), _WETH9: weth});

        MinimalERC20(token0).mint(address(this), 1_000_000 ether);
        MinimalERC20(token1).mint(address(this), 1_000_000 ether);
        MinimalERC20(token0).approve(address(npm), type(uint256).max);
        MinimalERC20(token1).approve(address(npm), type(uint256).max);
        MinimalERC20(token0).approve(address(router), type(uint256).max);
        MinimalERC20(token1).approve(address(router), type(uint256).max);
    }

    function test_createPool_mint_swap() public {
        int24 tickLower = (TickMath.MIN_TICK / TICK_SPACING) * TICK_SPACING;
        int24 tickUpper = (TickMath.MAX_TICK / TICK_SPACING) * TICK_SPACING;

        (uint256 tokenId, uint128 liquidity,,) = npm.mint(
            INonfungiblePositionManager.MintParams({
                token0: token0,
                token1: token1,
                tickSpacing: TICK_SPACING,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: 100_000 ether,
                amount1Desired: 100_000 ether,
                amount0Min: 0,
                amount1Min: 0,
                recipient: address(this),
                deadline: block.timestamp + 1,
                sqrtPriceX96: SQRT_PRICE_1_1
            })
        );

        assertGt(uint256(tokenId), 0);
        assertGt(uint256(liquidity), 0);

        address pool = factory.getPool(token0, token1, TICK_SPACING);
        assertTrue(pool != address(0));
        assertTrue(factory.isPool(pool));

        uint256 balance1Before = MinimalERC20(token1).balanceOf(address(this));
        uint256 amountOut = router.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: token0,
                tokenOut: token1,
                tickSpacing: TICK_SPACING,
                recipient: address(this),
                deadline: block.timestamp + 1,
                amountIn: 1_000 ether,
                amountOutMinimum: 1,
                sqrtPriceLimitX96: 0
            })
        );

        assertGt(amountOut, 0);
        assertEq(MinimalERC20(token1).balanceOf(address(this)), balance1Before + amountOut);
    }
}

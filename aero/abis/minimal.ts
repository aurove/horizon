/** Minimal ABIs for pool creation / swap / LP against a deployed Slipstream stack. */

export const ICLFactoryAbi = [
  "function getPool(address tokenA, address tokenB, int24 tickSpacing) view returns (address pool)",
  "function createPool(address tokenA, address tokenB, int24 tickSpacing, uint160 sqrtPriceX96) returns (address pool)",
  "function tickSpacingToFee(int24 tickSpacing) view returns (uint24)",
  "function tickSpacings() view returns (int24[])",
  "function isPool(address pool) view returns (bool)",
  "function owner() view returns (address)",
] as const;

export const ICLPoolAbi = [
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function tickSpacing() view returns (int24)",
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, bool unlocked)",
  "function liquidity() view returns (uint128)",
] as const;

export const ISwapRouterAbi = [
  "function factory() view returns (address)",
  "function exactInputSingle((address tokenIn, address tokenOut, int24 tickSpacing, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)",
] as const;

export const INonfungiblePositionManagerAbi = [
  "function factory() view returns (address)",
  "function createAndInitializePoolIfNecessary(address token0, address token1, int24 tickSpacing, uint160 sqrtPriceX96) payable returns (address pool)",
  "function mint((address token0, address token1, int24 tickSpacing, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline, uint160 sqrtPriceX96) params) payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
  "function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, int24 tickSpacing, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
] as const;

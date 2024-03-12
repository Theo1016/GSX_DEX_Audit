// price feeds https://docs.chain.link/docs/binance-smart-chain-addresses/
const { expandDecimals } = require("../../test/shared/utilities");

module.exports = {
  bsc: {
    btcPriceFeed: { address: "0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf" },
    ethPriceFeed: { address: "0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e" },
    bnbPriceFeed: { address: "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE" },
    busdPriceFeed: { address: "0xcBb98864Ef56E9042e7d2efef76141f15731B82f" },
    usdcPriceFeed: { address: "0x51597f405303C4377E36123cBc172b13269EA163" },
    usdtPriceFeed: { address: "0xB97Ad0E74fa7d920791E90258A6E2085088b4320" },
    btc: {
      name: "btc",
      address: "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c",
      decimals: 18,
      priceFeed: "0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf",
      priceDecimals: 8,
      minProfitBps: 0,
      isStrictStable: false,
    },
    eth: {
      name: "eth",
      address: "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
      decimals: 18,
      priceFeed: "0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e",
      priceDecimals: 8,
      minProfitBps: 0,
      isStrictStable: false,
    },
    bnb: {
      name: "bnb",
      address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      decimals: 18,
      priceFeed: "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE",
      priceDecimals: 8,
      minProfitBps: 0,
      isStrictStable: false,
    },
    busd: {
      name: "busd",
      address: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
      decimals: 18,
      priceFeed: "0xcBb98864Ef56E9042e7d2efef76141f15731B82f",
      priceDecimals: 8,
      isStrictStable: true,
    },
    usdc: {
      name: "usdc",
      address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
      decimals: 18,
      priceFeed: "0x51597f405303C4377E36123cBc172b13269EA163",
      priceDecimals: 8,
      minProfitBps: 0,
      isStrictStable: true,
    },
    usdt: {
      name: "usdt",
      address: "0x55d398326f99059fF775485246999027B3197955",
      decimals: 18,
      priceFeed: "0xB97Ad0E74fa7d920791E90258A6E2085088b4320",
      priceDecimals: 8,
      minProfitBps: 0,
      isStrictStable: true,
    },
    nativeToken: {
      address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      decimals: 18,
    },
  },
  bscTest: {
    btcPriceFeed: { address: "0x5741306c21795FdCBb9b265Ea0255F499DFe515C" },
    ethPriceFeed: { address: "0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7" },
    bnbPriceFeed: { address: "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526" },
    busdPriceFeed: { address: "0x4037074c3fC1bA532789a53Fe7B4dce9f9a24851" },
    usdcPriceFeed: { address: "0x90c069C4538adAc136E051052E14c1cD799C41B7" },
    usdtPriceFeed: { address: "0xEca2605f0BCF2BA5966372C99837b1F182d3D620" },
    btc: {
      address: "0xA2D845CEDf34e0C05A03C8620E078AEbf8e55138",    // 代币地址
      decimals: 18,                                             // 代币精度
      priceFeed: "0x5741306c21795FdCBb9b265Ea0255F499DFe515C",  // 喂价合约
      priceDecimals: 8,                                         // 价格精度
      fastPricePrecision: 1000,                                 // 快速价格精准, 保留几位小数
      maxCumulativeDeltaDiff: 0.1 * 10 * 1000 * 1000,           // 最大累积差值  10% 
      isStrictStable: false,                                    // false: 非稳定币  true: 稳定币
      tokenWeight: 25000,                                       // 代币比例
      minProfitBps: 0,                                          // 最低利润基点
      maxUsdgAmount: 120 * 1000 * 1000,                         // 最大 USDG 金额 
      bufferAmount: 2500,                                       // 缓冲量
      isStable: false,                                          // 是否稳定
      isShortable: true,                                        // 可短接
      maxGlobalLongSize: 36 * 1000 * 1000,                      // 最大全局长尺寸
      maxGlobalShortSize: 20 * 1000 * 1000,                     // 最大全球短尺寸
      openInterestLimitLong: 80 * 1000 * 1000,                  // 未平仓合约多头限额
      openInterestLimitShort: 50 * 1000 * 1000,                 // 持仓限额空头
      maxOpenInterestLong: 80 * 1000 * 1000,                    // 多头最大持仓量
      maxOpenInterestShort: 50 * 1000 * 1000,                   // 空头最大持仓量 
      openInterestIncrementLong: 50 * 1000,                     // 多头未平仓合约增量
      openInterestIncrementShort: 75 * 1000,                    // 未平仓合约增量空头
      maxLiquidityThresholdLong: 15 * 1000 * 1000,              // 最大流动性门槛长
      maxLiquidityThresholdShort: 12 * 1000 * 1000,             // 最大流动性阈值短
      minLiquidityThresholdLong: 12 * 1000 * 1000,              // 最小流动性阈值长
      minLiquidityThresholdShort: 5 * 1000 * 1000,              // 最小流动性阈值空头
    },
    eth: {
      address: "0xb09a8E5858Ca13826CaA460E4de45FfDB653B10A",    
      decimals: 18,
      priceFeed: "0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7",
      priceDecimals: 8,
      fastPricePrecision: 1000,
      maxCumulativeDeltaDiff: 0.1 * 10 * 1000 * 1000,           // 10%
      isStrictStable: false,
      tokenWeight: 30000,
      minProfitBps: 0,
      maxUsdgAmount: 120 * 1000 * 1000,
      bufferAmount: 50000,
      isStable: false,
      isShortable: true,
      maxGlobalLongSize: 88 * 1000 * 1000,
      maxGlobalShortSize: 40 * 1000 * 1000,
      openInterestLimitLong: 110 * 1000 * 1000,
      openInterestLimitShort: 70 * 1000 * 1000,
      maxOpenInterestLong: 100 * 1000 * 1000,
      maxOpenInterestShort: 60 * 1000 * 1000,
      openInterestIncrementLong: 50 * 1000,
      openInterestIncrementShort: 75 * 1000,
      maxLiquidityThresholdLong: 15 * 1000 * 1000,
      maxLiquidityThresholdShort: 12 * 1000 * 1000,
      minLiquidityThresholdLong: 12 * 1000 * 1000,
      minLiquidityThresholdShort: 5 * 1000 * 1000,
    },
    bnb: {
      name: "bnb",
      address: "0x563c384389a2C0b486ba11eFf45c7595A1D96FFa",
      decimals: 18,
      priceFeed: "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526",
      priceDecimals: 8,
      fastPricePrecision: 1000,
      maxCumulativeDeltaDiff: 0.1 * 10 * 1000 * 1000, // 10%
      isStrictStable: false,
      tokenWeight: 1000,
      minProfitBps: 0,
      maxUsdgAmount: 6.1 * 1000 * 1000,
      bufferAmount: 450000,
      isStable: false,
      isShortable: true,
      spreadBasisPoints: 0,
      maxGlobalShortSize: 500 * 1000,
      maxGlobalLongSize: 500 * 1000,
      openInterestLimitLong: 500 * 1000,
      openInterestLimitShort: 500 * 1000,
      maxOpenInterestLong: 500 * 1000,
      maxOpenInterestShort: 500 * 1000,
      openInterestIncrementLong: 25 * 1000,
      openInterestIncrementShort: 25 * 1000,
      maxLiquidityThresholdLong: 250 * 1000,
      maxLiquidityThresholdShort: 250 * 1000,
      minLiquidityThresholdLong: 50 * 1000,
      minLiquidityThresholdShort: 50 * 1000,
    },
    usdc: {
      name: "usdc",                                            // 代币名称
      address: "0xB985f0C1A68380c46E6a31e7d7ed8A5a3aa6cD99",   // 代币地址
      decimals: 18,                                            // 精度
      priceFeed: "0x90c069C4538adAc136E051052E14c1cD799C41B7", // 取价合约
      priceDecimals: 8,                                        // 价格精度
      isStrictStable: true,                                    // 是否稳定币
      tokenWeight: 3000,                                       // 代币占比
      minProfitBps: 0,                                         // 最低利润基点
      maxUsdgAmount: 20 * 1000 * 1000,                         // 最大 USD 数量
      bufferAmount: 1 * 1000 * 1000,                           // 缓冲量
      isStable: true,                                          // 是否稳定
      isShortable: false,                                      // 是否可空
    },
    usdt: { 
      name: "usdt",                                            // 代币名称
      address: "0x3c8b68E906D29f6Fc3c0cc97F5CE70d02B4c5A74",   // 代币地址
      decimals: 18,                                            // 精度
      priceFeed: "0xEca2605f0BCF2BA5966372C99837b1F182d3D620", // 取价合约
      priceDecimals: 8,                                        // 价格精度
      isStrictStable: true,                                    // 是否稳定币
      tokenWeight: 3000,                                       // 代币占比
      minProfitBps: 0,                                         // 最低利润基点
      maxUsdgAmount: 13.5 * 1000 * 1000,                       // 最大 USD 数量
      bufferAmount: 1 * 1000 * 1000,                           // 缓冲量
      isStable: true,                                          // 是否稳定
      isShortable: false,                                      // 是否可空
    },
    nativeToken: {
      address: "0x563c384389a2C0b486ba11eFf45c7595A1D96FFa",
      decimals: 18
    },
  }
};

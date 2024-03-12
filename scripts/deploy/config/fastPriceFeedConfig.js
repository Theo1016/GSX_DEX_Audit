const network = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('../tokens')[network];
const {
    bscTestAddress
  } = require("../../deployments/new_address.json")

module.exports = {
    bscTest: {
        Tokens: [tokens.btc, tokens.eth, tokens.bnb], // fastPriceFeed 合约配置需喂价token
        TokenMannager: bscTestAddress.admin,      // fastPriceFeed 管理员
        Updaters: [bscTestAddress.admin],    // fastPriceFeed 喂价员
        Signers: [bscTestAddress.admin],     // fastPriceFeed 签名员
        PriceDuration: 5 * 60,               // 价格持续时间, 如果上次喂价时间超过这个限制, 那么取价时就对价格进行加点处理
        maxPriceUpdateDelay: 60 * 60,                     // 价格更新延迟时间, 如果上次喂价时间超过这个限制, 那么取价时就对价格进行加点处理
        minBlockInterval: 1,                              // 价格最小区块间隔, 喂价价格必须超过这个区块间隔
        maxDeviationBasisPoints: 250,                     // 0.025 // 最大偏差基点  如果 referPrice 与 fastPrice 的价差比例超过了 这个限制, 那么就取最大价格(最小价格), 没超过, 就取 fastPrice
        MinAuthorizations: 1,                // 最小授权数
        maxTimeDeviation: 60 * 60,                        // 最大时间偏差, 如果喂价时间撮 不在 前后 这个限制内, 价格喂不进去
        spreadBasisPointsIfInactive: 50,                  // 如果不活跃则传播基点 0.5%
        spreadBasisPointsIfChainError: 500,               // 如果错误则传基点 5%
        PriceDataInterval: 1 * 60                         // 价格数据时间间隔 在这个时间内, 累计变化, 该变化不能超过一个值
    }
}

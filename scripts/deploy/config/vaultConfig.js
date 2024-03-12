const { toUsd } = require("../../../test/shared/units")

module.exports = {
    bscTest: {
        liquidationFeeUsd:  toUsd(2), // vault 清算费用
        fundingRateFactor: 100,  // 非稳定币资金费率放大基础 
        stableFundingRateFactor: 100, // 稳定币资金费率放大基础
        fundingInterval: 60 * 60,  // 资金费收取间隔时间
        taxBasisPoints: 10,    // swap 基本费率  0.1%
        stableTaxBasisPoints: 5, // 稳定币 基本费率 0.05%
        swapFeeBasisPoints: 20,       // 非稳定币 swap 费率  0.2%
        stableSwapFeeBasisPoints: 1,  // 稳定币 swap 费率  0.01% 

        mintBurnFeeBasisPoints: 20,   // 添加移除流动性费率 0.2%
        marginFeeBasisPoints: 10,     // 开仓费率 0.1%
        minProfitTime: 24 * 60 * 60,  // 最低利润时间限制, 如果 minProfitTime 已过，则不会有最低利润阈值, 最低利润阈值有助于防止抢先交易问题
        hasDynamicFees: true  // 是否有动态费用
    }
}
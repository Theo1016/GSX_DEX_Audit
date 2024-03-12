const { expandDecimals } = require("../../../test/shared/utilities")

module.exports = {
    bscTest: {
        MinExecutionFee: "2000000000000000", // 执行订单最小执行费
        minPurchaseTokenAmountUsd: expandDecimals(10, 30) // 最小下单代币金额（美元）
    }
}
module.exports = {
    bscTest: {
        MinExecutionFee: "2000000000000000", // 0.002 bnb
        DepositFee: 30, // 0.3% 押金费率 
        minBlockDelayKeeper: 0,   // 最小块延迟值, 市价单下单超过最小区块限制, 才允许执行
        minTimeDelayPublic: 180,  // 最小时间延迟值, 市价单下单超过最小时间限制, 才允许执行
        maxTimeDelay: 30 * 60  // 最大时间延迟值, 市价单下单未超过最大时间限制, 才允许执行
    }
}
const { expandDecimals } = require("../../../test/shared/utilities")
const {
    bscTestAddress
  } = require("../../deployments/new_address.json")
module.exports = {
    bscTest: {
        Buffer: 24 * 60 * 60,                   // Timelock 解锁时间
        Handlers: [ bscTestAddress.admin],      // Timelock 合约 控制员
        Keepers: [ bscTestAddress.admin],       // Timelock 合约 Keepers
        maxTokenSupply: expandDecimals("13250000", 18), // timeLock 合约 maxTokenSupply
        MarginFeeBasisPoints: 10,      // 0.1% 跟vault 相关
        MaxMarginFeeBasisPoints: 500   // 5% 跟vault 相关
    }
}
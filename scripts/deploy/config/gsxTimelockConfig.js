const { expandDecimals } = require("../../../test/shared/utilities")
const {
    bscTestAddress
  } = require("../../deployments/new_address.json")
module.exports = {
    bscTest: {
        Buffer: 5 * 24 * 60 * 60,                   // Timelock 解锁时间
        longBuffer: 7 * 24 * 60 * 60,
        Handlers: [ bscTestAddress.admin],      // Timelock 合约 控制员
        Keepers: [ bscTestAddress.admin],       // Timelock 合约 Keepers
        maxTokenSupply: expandDecimals("13250000", 18), // timeLock 合约 maxTokenSupply
    }
}
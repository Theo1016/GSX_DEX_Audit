const {
    bscTestAddress
  } = require("../../deployments/new_address.json")
  
module.exports = {
    bscTest: {
        Buffer: 24 * 60 * 60,  // PriceFeedTimelock 解锁时间
        Signers: [ bscTestAddress.admin],
        Keepers: [ bscTestAddress.admin]
    }
}
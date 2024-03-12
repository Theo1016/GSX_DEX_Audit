const {
    bscTestAddress
  } = require("../../deployments/new_address.json")
  
module.exports = {
    bscTest: {
        Signers: [bscTestAddress.admin],    // tokenManafer 合约 签名者
        minAuthorizations: 1     // tokenManafer 最小授权数
    }
}
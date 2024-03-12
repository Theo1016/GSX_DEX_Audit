const {
    bscTestAddress
  } = require("../../deployments/new_address.json")
  
module.exports = {
    bscTest: {
        Buffer: 60,  // PriceFeedTimelock 解锁时间
        UpdateDelay: 600,  // 更新全局仓位的时间限制, 必须超过该配置才能更新
        Handlers: [ bscTestAddress.admin],
        maxAveragePriceChange: 20 // 0.2 % 最大平均价格变动, 更新全局仓位时, 均价变动不能超过该配置比例
    }
}
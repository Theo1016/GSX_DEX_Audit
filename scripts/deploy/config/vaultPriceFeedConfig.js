const { expandDecimals } = require("../../../test/shared/utilities")

module.exports = {        
    bscTest: {    
        MaxStrictPriceDeviation: expandDecimals(1, 28), // vaultPriceFeed 稳定币最大价格偏差 0.01
        PriceSampleSpace: 1, // vaultPriceFeed 价格样本空间 
        AmmEnabled: false   // vaultPriceFeed AMM 价格开关 
    }
  }
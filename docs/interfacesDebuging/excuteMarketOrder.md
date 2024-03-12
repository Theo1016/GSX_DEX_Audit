# 执行市价单
# 相关合约: 
fastPriceFeed: 0x4CDA725c6699f9028C1E11302416dBC1263B2CCd

# 执行地址:
update: 需要联系管理员为 fastPriceFeed 设置 update 权限

# 执行条件:
- keeper: 需要设置
- 设置positionRouter 为 shortsTracker 的 handler
- 设置positionRouter 为 timeLock 的 handler

# 主要接口:
  - approvedPlugins(router合约)  检测是否已授权插件
```
    setPricesWithBitsAndExecute(
        uint256 _priceBits,    // 组合价格, 需计算
        uint256 _timestamp,    // block.time, 获取区块链时间撮
        uint256 _endIndexForIncreasePositions,  // 加仓订单索引, 执行到哪个索引截止
        uint256 _endIndexForDecreasePositions,  // 减仓订单索引, 执行到哪个索引截止
        uint256 _maxIncreasePositions,  // 最大执行多少个加仓订单
        uint256 _maxDecreasePositions   // 最大执行多少个减仓订单
        )
```


```
组合价格计算方式
function getPriceBits(prices) {                  // prices: list, FastPriceFeed包含的所有代币价格, 这里的价格需要计算与chainLink 价格上下偏差 0.5 %
  if (prices.length > 8) {                  
    throw new Error("max prices.length exceeded")
  }

  let priceBits = new BN('0')

  for (let j = 0; j < 8; j++) {          
    let index = j
    if (index >= prices.length) {
      break
    }

    const price = new BN(prices[index])

    priceBits = priceBits.or(price.shln(j * 32))   // 或运算, 循环左移动 j* 32 位
  }

  return priceBits.toString()
}
```
# 仓位数据获取------相关合约: vault
```
function getPosition(
    address _account,  // 用户地址
    address _collateralToken,  // 抵押代币
    address _indexToken,  // 指数代币
    bool _isLong  // 多空
    ) return (
            position.size,              // 仓位大小
            position.collateral,        // 抵押代币
            position.averagePrice,      // 入场均价
            position.entryFundingRate,  // 入场资金费率
            position.reserveAmount,     // 储备金额
            realisedPnl,                // 已实现盈亏
            position.realisedPnl >= 0,  // 盈亏
            position.lastIncreasedTime  // 最后加仓时间
    )
```
# 订单数据获取------相关合约: OrderBook
```
function  increaseOrders(
    address _account,  // 用户地址
    uint256 index      // 订单id,来自后端 (后端检测到事件后, 将id 存起来, 并且该id还未执行
)
```

```
function  decreaseOrders(
    address _account,  // 用户地址
    uint256 index      // 订单id,来自后端 (后端检测到事件后, 将id 存起来, 并且该id还未执行
)
```

# 清算价格计算
- 1、公式:
    =>  liq.price = ((抵押品价值 - 清算费用 - 保证金费用) / 仓位价值) * averagePrice + averagePrice
    
    ```
    做多: liq.price = averagePrice - ((抵押品价值 + 盈亏价值 - 清算费用(开仓费用、借贷费用)) / 仓位价值 * averagePrice)
    做空: liq.price = averagePrice + ((抵押品价值 + 盈亏价值 - 清算费用(开仓费用、借贷费用)) / 仓位价值 * averagePrice)
    ```

- 相关接口:  Vault合约

    - 开仓费用、借贷费用

```
getPositionFee(
    address /* _account */,           // 账户地址
    address /* _collateralToken */,   // 抵押代币
    address /* _indexToken */,        // 指数代币
    bool /* _isLong */,               // 多空
    uint256 _sizeDelta                // 减少的仓位价值,这里特指 抵押品价值
)
```



```
getFundingFee(
    address  _account,         // 账户地址
    address _collateralToken,  // 抵押代币
    address  _indexToken,      // 指数代币
    bool  _isLong,             // 多空
    uint256 _size,             // 仓位价值
    uint256 _entryFundingRate  // 入场资金
   )
```
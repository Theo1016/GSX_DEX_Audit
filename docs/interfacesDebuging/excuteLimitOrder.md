# 执行限价单
# 相关合约: 
PositionManager: 0xB6ffa89ADd89c1834ba9134c7E4D43a73044ab87
# 执行地址:
keeper: 需要联系管理员为其设置权限

# 主要接口
- executeIncreaseOrder  执行限价加仓订单
```
  executeIncreaseOrder(
    address _account,     // 用户地址
    uint256 _orderIndex,  // 限价加仓订单索引
    address _feeReceiver  // 执行费用接收地址
    )
```

- executeDecreaseOrder  执行限价减仓订单
```
    executeDecreaseOrder(
      address _account,     // 用户地址
      uint256 _orderIndex,  // 限价减仓订单索引
      address _feeReceiver  // 执行费用接收地址
    )
```

- liquidatePosition  执行清算
```
  function liquidatePosition(
        address _account,          // 清算用户账户地址
        address _collateralToken,  // 抵押代币地址
        address _indexToken,       // 指数代币
        bool _isLong,              // 多空
        address _feeReceiver       // 费用接收地址
    ) 
```


# 加仓做多: _triggerAboveThreshold 为false   当前价 < 触发价
# 加仓做空: _triggerAboveThreshold 为true    当前价 > 触发价
# 减仓做多: _triggerAboveThreshold 为true    当前价 > 触发价
# 减仓做空: _triggerAboveThreshold 为false   当前价 < 触发价

# 加仓做多: maxPrice < 触发价
# 加仓做空: minPrice > 触发价
# 减仓做多: minPrice > 触发价
# 减仓做空: maxprice < 触发价 
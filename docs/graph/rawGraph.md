
# 表1: transactions (区块交易事件)
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | transactionIndex | Int!| 交易索引 | 
  | blockNumber | Int! | 交易区块高度 | 
  | timestamp | Int! | 交易时间戳 | 
  | from | String! | 发送交易地址 | 

# 表2: StakeGsx (质押gsx事件)
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | account | String!| 质押账户 | 
  | token | String! | 质押代币 | 
  | amount | BigInt! | 质押数量 | 
  | transaction | Transaction! | 交易 | 
  | timestamp | Int| 时间戳 |

# 表3: UnstakeGsx (赎回gsx质押)

  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | account | String!| 质押账户 | 
  | token | String! | 质押代币 | 
  | amount | BigInt! | 质押数量 | 
  | transaction | Transaction! | 交易 | 
  | timestamp | Int| 时间戳 |

# 表4: StakeGsp (质押gsp事件)
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | account | String!| 质押账户 | 
  | amount | BigInt! | 质押数量 | 
  | transaction | Transaction! | 交易 | 
  | timestamp | Int| 时间戳 |

# 表5: UnstakeGsp (赎回gsp质押)

  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | account | String!| 质押账户 | 
  | amount | BigInt! | 质押数量 | 
  | transaction | Transaction! | 交易 | 
  | timestamp | Int| 时间戳 |

# 表6: CollectMarginFee (收取多空开仓费)
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | token | Bytes!| 支付费用代币 | 
  | feeUsd | BigInt! | 费用价值(USD) | 
  | feeTokens | BigInt! | 支付费用代币 | 
  | transaction |  Transaction |  交易 |
  | timestamp | Int | 时间撮 |

# 表7: CollectSwapFee (swap 费用收取)

  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | token | Bytes!| 支付费用代币 | 
  | feeUsd | BigInt! | 费用价值(USD) | 
  | feeTokens | BigInt! | 支付费用代币 | 
  | transaction |  Transaction |  交易 |
  | timestamp | Int | 时间撮 |

# 表8: UpdatePosition (更新仓位事件)
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | key | String!| 仓位 key | 
  | size | BigInt! | 仓位价值USD | 
  | collateral | BigInt! | 抵押品价值USD | 
  | averagePrice | BigInt| 均价USD |
  | entryFundingRate | BigInt | 入场资金费率 |
  | reserveAmount | BigInt | 储存资金USD |
  | realisedPnl | BigInt | 已实现盈利 | 
  | transaction | Transaction | 交易 |
  | logIndex | Int | 日志索引 |
  | timestamp | Int | 时间撮 |

# 表9: ClosePosition (关闭仓位事件)

  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | key | String!| 仓位 key | 
  | size | BigInt! | 仓位价值USD | 
  | collateral | BigInt! | 抵押品价值USD | 
  | averagePrice | BigInt| 均价USD |
  | entryFundingRate | BigInt | 入场资金费率 |
  | reserveAmount | BigInt | 储存资金USD |
  | realisedPnl | BigInt | 已实现盈利 | 
  | transaction | Transaction | 交易 |
  | logIndex | Int | 日志索引 |
  | timestamp | Int | 时间撮 |

# 表10: LiquidatePosition (清算事件)

  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | key | String!| 仓位 key | 
  | account | String! | 仓位账户地址 | 
  | collateralToken | String! | 抵押代币 | 
  | indexToken | String| 指数代币 |

  | isLong | Boolean | 多空 |

  | size | BigInt | 仓位价值USD |
  | collateral | BigInt | 抵押代币价值 | 
  | reserveAmount | BigInt | 储存资金USD |
  | realisedPnl | BigInt | 已实现盈利 |
  | markPrice | BigInt | 市价 |

  | transaction | Transaction | 交易 |
  | logIndex | Int | 日志索引 |
  | timestamp | Int | 时间撮 |

# 表11: CreateIncreasePosition (创建加仓订单事件)

  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | account | String! | 仓位账户地址 | 
  | collateralToken | String! | 抵押代币 | 
  | indexToken | String| 指数代币 |

  | isLong | Boolean | 多空 |
  | amountIn | BigInt | 支付代币数量 |

  | sizeDelta | BigInt | 仓位增加价值USD |
  | acceptablePrice | BigInt | 市场价 | 
  | executionFee | BigInt | 执行费用 |

  | transaction | Transaction | 交易 |
  | timestamp | Int | 时间撮 |

# 表12: CreateDecreasePosition (创建加仓订单事件)

  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | account | String! | 仓位账户地址 | 
  | collateralToken | String! | 抵押代币 | 
  | indexToken | String| 指数代币 |
  | isLong | Boolean | 多空 |

  | sizeDelta | BigInt | 仓位增加价值USD |
  | acceptablePrice | BigInt | 市场价 | 
  | executionFee | BigInt | 执行费用 |

  | transaction | Transaction | 交易 |
  | timestamp | Int | 时间撮 |

# 表13: IncreasePosition (创建加仓仓位事件)

  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | key | String | 仓位key |
  | account | String! | 仓位账户地址 | 
  | collateralToken | String! | 抵押代币 | 
  | indexToken | String| 指数代币 |

  | collateralDelta | 抵押代币增加价值USD |
  | sizeDelta | 仓位增加价值 |
  | isLong | Boolean | 多空 |

  | price | BigInt | 价格 |
  | fee | BigInt | 费用 | 

  | transaction | Transaction | 交易 |
  | timestamp | Int | 时间撮 |

# 表14: DecreasePosition (创建加仓仓位事件)

  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | key | String | 仓位key |
  | account | String! | 仓位账户地址 | 
  | collateralToken | String! | 抵押代币 | 
  | indexToken | String| 指数代币 |

  | collateralDelta | 抵押代币增加价值USD |
  | sizeDelta | 仓位增加价值 |
  | isLong | Boolean | 多空 |

  | price | BigInt | 价格 |
  | fee | BigInt | 费用 | 

  | transaction | Transaction | 交易 |
  | timestamp | Int | 时间撮 |

# 表15: AddLiquidity (添加流动性事件)

  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | account | String! | 仓位账户地址 | 
  | token | String | 质押代币 |

  | amount | BigInt! | 质押代币数量 | 
  | aumInUsdg | BigInt| 质押池总USDG数量 |
  | gspSupply | BigInt | gsp 发行量 |
  | usdgAmount | BigInt | usdg 兑换数量
  | mintAmount | BigInt | mint usdg数量 |

  | transaction | Transaction | 交易 |
  | timestamp | Int | 时间撮 |

# 表16: RemoveLiquidity (移除流动性事件)

  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | account | String! | 仓位账户地址 | 
  | token | String | 质押代币 |

  | amount | BigInt! | 质押代币数量 | 
  | aumInUsdg | BigInt| 质押池总USDG数量 |
  | gspSupply | BigInt | gsp 发行量 |
  | usdgAmount | BigInt | usdg 兑换数量
  | mintAmount | BigInt | mint usdg数量 |

  | transaction | Transaction | 交易 |
  | timestamp | Int | 时间撮 |

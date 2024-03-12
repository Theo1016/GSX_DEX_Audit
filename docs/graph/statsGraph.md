# k线价格

# 表1: TokenStat   代币状态
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | token | String!| 代币地址 | 
  | poolAmount | BigInt! | 流动性池子 | 
  | poolAmountUsd | BigInt! | 流动性池子USD | 
  | usdgAmount | BigInt | usdg数量
  | reservedAmount | BigInt! | 储备代币 | 
  | reservedAmountUsd | BigInt! | 储备代币USD | 
  | timestamp | Int! | 时间戳 | 
  | period | Period! | 时间粒度: 每小时、每天、每周、总 |

# 表2: ActivePosition   存活仓位
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | averagePrice | BigInt!| 均价 | 
  | entryFundingRate | BigInt! | 入场资金费率 | 
  | collateral | BigInt! | 抵押品价值 | 
  | size | BigInt | 仓位价值

# 表3: LiquidatedPosition 清算仓位
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | key | String!| 仓位key | 
  | account | String! | 仓位所属账户 | 
  | timestamp | Int! | 时间撮 | 
  | indexToken | String | 指数代币 |
  | size | BigInt | 仓位大小 |
  | isLong | Boolean | 多空 |
  | collateralToken | String | 抵押代币 |
  | collateral | BigInt | 抵押价值 |
  | markPrice | BigInt | 市价 |
  | averagePrice | BigInt | 均价 |
  | loss | BigInt | 损失 |
  | type | LiquidationType | 清算类型: 全清、部分清 |
  | borrowFee | BigInt | 借款费用 |

# 表4: ChainlinkPrice  chainlink 价格
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | token | String!| 代币 | 
  | value | BigInt! | 价格 | 
  | timestamp | Int! | 时间撮 | 
  | blockNumber | Int | 区块数 |
  | period | PricePeriod | 时间粒度: any\last\ |

# 表5: FastPrice    内部价格
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | token | String!| 代币 | 
  | value | BigInt! | 价格 | 
  | timestamp | Int! | 时间撮 | 
  | blockNumber | Int | 区块数 |
  | period | PricePeriod | 时间粒度: any\last\ |

# 表6: FundingRate    借款费率
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | startFundingRate | Int!| 开始费率 | 
  | startTimestamp | Int! | 开始时间 | 
  | endFundingRate | Int! | 解释费率 | 
  | endTimestamp | Int | 结束时间 |
  | token | String | 代币 |
  | timestamp | Int | 时间撮 |
  | period | Period | 时间粒度: any\last\daiy\hourly |

# 表7: TradingStat 交易状态
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | profit | BigInt!| 盈利多少 | 
  | loss | BigInt! | 亏损多少 | 
  | profitCumulative | BigInt! | 利润累计 | 
  | lossCumulative | BigInt | 亏损累计 |
  | longOpenInterest | BigInt | 多头未平仓 |
  | shortOpenInterest | BigInt | 空头未平仓 |
  | liquidatedCollateral | BigInt | 清算抵押品 |
  | liquidatedCollateralCumulative | BigInt |  清算抵押品累计 |
  | timestamp | Int | 时间撮 |
  | period | Period | 时间粒度: any\last\daiy\hourly |

# 表8: Order 订单
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | type | String!| 订单类型 | 
  | account | String! | 账户地址 | 
  | status | OrderStatus! | 状态: open/cancelled/executed | 

  | index | BigInt | 索引 |
  | size | BigInt | 仓位大小 |

  | createdTimestamp | Int | 创建时间 |
  | cancelledTimestamp | Int | 取消时间 |
  | executedTimestamp | Int |  执行时间 |

# 表9: OrderStat 状态
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | openSwap | Int!| swap 存活订单数 | 
  | openIncrease | Int! | 加仓存活订单数 | 
  | openDecrease | Int! | 减仓存活订单数 | 

  | cancelledSwap | Int | 取消订单次数 |
  | cancelledIncrease | Int | 取消订单次数 |
  | cancelledDecrease | Int | 取消订单次数 |

  | executedSwap | Int | 执行订单次数 |
  | executedIncrease | Int |  执行订单次数 |
  | executedDecrease | Int | 执行订单次数 |
  | period | Period | 时间粒度: any\last\daiy\hourly |

# 表10: UserData 用户数据
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | actionSwapCount | Int!| 交换次数 | 
  | actionMarginCount | Int! | 合约次数 | 
  | actionMintBurnCount | Int! | 添加流动性次数 | 

  | timestamp | Int | 时间撮 |
  | period | Period | 时间粒度: any\last\daiy\hourly |

# 表11: UserStat 用户状态
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | uniqueCount | Int!| 交换次数 | 
  | uniqueSwapCount | Int! | 合约次数 | 
  | uniqueMarginCount | Int! | 添加流动性次数 | 
  | uniqueMintBurnCount | Int! | 

  | uniqueCountCumulative | Int! |
  | uniqueSwapCountCumulative | Int! |
  | uniqueMarginCountCumulative | Int! |
  | uniqueMintBurnCountCumulative | Int! |

  | actionCount | Int! |
  | actionSwapCount | Int! |
  | actionMarginCount | Int! |
  | actionMintBurnCount | Int! |

  | timestamp | Int | 时间撮 |
  | period | Period | 时间粒度: any\last\daiy\hourly |

# 表12: HourlyGspStat 每小时gsp状态
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | gspSupply | Int!| gsp 总发行量 | 
  | aumInUsdg | Int! | 流动池USDG总量 | 
  
# 表13: GspStat gsp状态
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | gspSupply | BigInt!| gsp 总发行量 | 
  | aumInUsdg | BigInt! | 流动池USDG总量 | 
  | distributedEth | BigInt! | 手续费分发 |
  | distributedEthCumulative | BigInt! |  累计手续费分发 |
  | distributedUsd | BigInt! | 分发USD |
  | distributedUsdCumulative | BigInt! | 累计USD 分发 |
  | distributedEsgsx | BigInt! | Esgsx 分发 |
  | distributedEsgsxCumulative | BigInt! |  累计 Esgsx分发 |
  | distributedEsgsxUsd | BigInt! | 累计 Esgsx USD分发 |
  | distributedEsgsxUsdCumulative | BigInt! | 累计 Esgsx USD 分发 | 
  | timestamp | Int | 时间撮 |
  | period | Period | 时间粒度: any\last\daiy\hourly |

# 表14: HourlyVolume 每小时数据
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | margin | BigInt!| 合约交易量 | 
  | swap | BigInt! | swap交易量 | 
  | liquidation | BigInt! | 清算量 | 
  | mint | BigInt! | gsp 添加流动性量 |
  | burn | BigInt! | gsp 销毁流动性量 |


# 表15: VolumeStat 各数据状态
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | margin | BigInt!| 合约交易量 | 
  | swap | BigInt! | swap交易量 | 
  | liquidation | BigInt! | 清算量 | 
  | mint | BigInt! | gsp 添加流动性量 |
  | burn | BigInt! | gsp 销毁流动性量 |
  | period | Period | 时间粒度: any\last\daiy\hourly |

# 表16: HourlyVolumeBySource 每小时数据(按涞源)
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | source | String! | 来源: swap、margin |
  | timestamp | Int! |  时间撮 |
  | margin | BigInt!| 合约交易量 | 
  | swap | BigInt! | swap交易量 | 
  | liquidation | BigInt! | 清算量 | 
  | mint | BigInt! | gsp 添加流动性量 |
  | burn | BigInt! | gsp 销毁流动性量 |
  
# 表17: HourlyVolumeByToken 每小时数据(按token)
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | tokenA | Bytes! | tokenA 地址 |
  | tokenB | Bytes! | tokenB 地址 |
  | timestamp | Int! |  时间撮 |
  | margin | BigInt!| 合约交易量 | 
  | swap | BigInt! | swap交易量 | 
  | liquidation | BigInt! | 清算量 | 
  | mint | BigInt! | gsp 添加流动性量 |
  | burn | BigInt! | gsp 销毁流动性量 |
  
# 表18: HourlyFee 每小时手续费收取
  | id | ID | 唯一id |
  | margin | BigInt!| 合约手续费 | 
  | swap | BigInt! | swap手续费| 
  | liquidation | BigInt! | 清算手续费 | 
  | mint | BigInt! | gsp 铸造手续费 |
  | burn | BigInt! | gsp 添加流动性手续费 |
  | period | Period | 时间粒度: any\last\daiy\hourly |
  
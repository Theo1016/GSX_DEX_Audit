# k线价格

- 表1: PriceCandle
  | 字段 | 类型 | 说明 |
  |---------|---------|---------|
  | id | ID | 唯一id |
  | token | String!| 代币地址 | 
  | open | BigInt! | 开盘价 | 
  | high | BigInt! | 最高价 | 
  | low | BigInt! | 最低价 | 
  | close | Int! | 收盘价 | 
  |timestamp | Int! | 时间戳
  |period| String! | k线粒度: 5m 15m 1h 4h 1d
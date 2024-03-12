# 1.role configuration 
  | name | desc |
  |---------|---------|
  | depyler | Deployed contract's wallet address. |
  | updater | Users with permission to update prices. |
  | keeper  | Users with permission to modify certain dynamic variable values, such as executing orders, setting fees, etc. | 
  | liquidator | The wallet address with permission to execute liquidations. | 
  | Signer | The wallet address with permission to sign transactions. |


# 2.GSX token configuration

- (1) penalty level

| index | desc | liquidityFee | taxFee | ownerFee | burnFee | ecoSystem | owner |
|---------|---------|---------|---------|---------|---------|---------|---------|
| 0 | 0% | 5% | 5% | 0 | 0 | address1 | address2

- (2) name: GSX
- (3) symbol: GSX
- (4) totalSubly: 1000000000000


# 3.Contract configuration
## 3.1 fastPriceFeed 
  | name | desc |
  |---------|---------|
  | Tokens | The configuration of the fastPriceFeed contract requires the token for price feeding. | 
  | TokenMannager | Administrator |
  | Updaters | User role for updating prices |
  | Signers | User signing transactions |
  | PriceDuration | Price duration, if the time since the last feed exceeds this limit, then the price is adjusted when retrieved. |
  | maxPriceUpdateDelay | Price update delay time, if the time since the last feed exceeds this limit, then the price is adjusted when retrieved. | 
  | minBlockInterval | The minimum block interval for price feeding; the price feed must exceed this block interval. | 
  | maxDeviationBasisPoints | The maximum deviation basis points. If the price difference ratio between referPrice and fastPrice exceeds this limit, then the maximum (or minimum) price is taken; if not exceeded, fastPrice is taken. |
  | MinAuthorizations | The minimum authorization amount. |
  | maxTimeDeviation | The maximum time deviation. If the feed time stamp is not within the limit set before or after, the price feed will not be accepted. | 
  | spreadBasisPointsIfInactive | If inactive, propagate basis points |
  | spreadBasisPointsIfChainError | If there is an error updating the price, propagate basis points. |
  | PriceDataInterval |  Price data time interval. Within this time period, cumulative change |

## 3.2 gspManager
  | name | desc |
  |---------|---------|
  | cooldownDuration |  The removal of liquidity transactions in the GspManager must occur after this time limit. |

## 3.3 orderBook
  | name | desc |
  |---------|---------|
  | MinExecutionFee | Minimum execution fee for orders |  
  | minPurchaseTokenAmountUsd | Minimum order token amount (USD) |

## 3.4 PositionRouter
  | name | desc |   
  |---------|---------|
  | MinExecutionFee |Minimum execution fee for orders |
  | DepositFee | Deposit fee rate |
  | minBlockDelayKeeper | Minimum block delay value. Market orders are only allowed to execute if the order placement exceeds the minimum block limit. |
  | minTimeDelayPublic | Minimum time delay value. Market orders are only allowed to execute if the order placement exceeds the minimum time limit. |
  | maxTimeDelay | Maximum time delay value. Market orders are only allowed to execute if the order placement does not exceed the maximum time limit. |

## 3.5 priceFeedTimelock
  | name | desc |   
  |---------|---------|
  | Buffer | Unlock time |
  | Signers | Transaction signers | 
  | Keepers | Administrator |

## 3.6 shortsTrackerTimelock
  | name | desc |   
  |---------|---------|
  | Buffer | Unlock time |
  | UpdateDelay | The time limit for updating global positions, must exceed this configuration to update. |
  | Handlers | Users with operational permissions |
  | maxAveragePriceChange | The maximum average price change. When updating global positions, the average price change cannot exceed this configured percentage. |

## 3.7 timelock
  | name | desc |   
  |---------|---------|
  | Buffer | Unlock time |
  | Handlers | Users with control permissions |
  | Keepers | Users with monitoring permissions | 
  | maxTokenSupply | - |
  | MarginFeeBasisPoints | - |
  | MaxMarginFeeBasisPoints | - |

## 3.8 tokenManager 
  | name | desc |   
  |---------|---------|
  | Signers | Users with sign permissions |
  | minAuthorizations | - |

## 3.9 Vault
  | name | desc |   
  |---------|---------|
  | liquidationFeeUsd |  Liquidation fee |
  | fundingRateFactor | Multiplier for amplifying non-stablecoin funding rates |
  | stableFundingRateFactor | Multiplier for amplifying stablecoin funding rates |
  | fundingInterval | Funding fee collection interval |
  | taxBasisPoints | Basic swap fee rate |
  | stableTaxBasisPoints | Basic fee rate for stablecoins |
  | swapFeeBasisPoints | Swap fee rate for non-stablecoins |
  | stableSwapFeeBasisPoints | Swap fee rate for stablecoins |
  | mintBurnFeeBasisPoints | Add/remove liquidity fee rate |
  | marginFeeBasisPoints | Opening fee rate |
  | minProfitTime | The minimum profit time limit. If the minProfitTime has elapsed, there will be no minimum profit threshold. The minimum profit threshold helps prevent frontrunning issues. |
  | hasDynamicFees | If set to false, all fee-related parameters will remain static as configured, without dynamic changes |

## 3.10 VaultPriceFeed
  | name | desc |   
  |---------|---------|
  | MaxStrictPriceDeviation | Stablecoin maximum price deviation. If the stablecoin price exceeds this configured percentage above or below 1 USD, the price is set to 1. If it does not exceed, the price is set to the actual value. |
  | PriceSampleSpace | Get prices, maximum and minimum, from this price range. Obtain from the latest PriceSampleSpace prices within this range. |
  | AmmEnabled | Whether to use AMM prices |

## 3.11 Vester
   | name | desc |   
  |---------|---------|
  | Duration | Unlock time configuration for pledging esGSX
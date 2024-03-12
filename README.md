# GSX-DEX

- [GSX-DEX](#GSX-DEX)
  - [About](#about)
  - [User flow](#User-flow)
  - [Summary](#summary)
  - [Config](#config)
- [Getting Started](#getting-started)
  - [Requirements](#requirements)
  - [Quickstart](#quickstart)
- [Usage](#usage)
  - [Testing](#testing)
    - [Test Coverage](#test-coverage)
- [Audit Scope Details](#audit-scope-details)

## About
- [DEX](./contracts/dex/) [aggregator](./contracts/aggregator/): A decentralized exchange (DEX) within a single chain, providing services such as aggregated swaps, contract trading, token staking, etc. The protocol allows users to stake their own tokens into liquidity pools, and users can pay tokens to long or short index tokens. During the process of adding liquidity, users can also obtain platform tokens through staking. Structurally, the protocol can be divided into two parts: market and user;
   - market: Spot and perpetual trading are created through specifying long collateral token LongToken, short collateral token ShortToken, and index token IndexToken. For the ETH/USD market, the long collateral token is ETH, the short collateral token is a stablecoin, and the index token is ETH.
   - user: 
         - Users providing liquidity: Users providing liquidity by injecting funds into liquidity pools (markets) for the DEX
         - Perpetual trading users: Participants in the market for short/long positions
         - swap users: Wishing to exchange tokens at the best exchange rate

- [GsxToken](./contracts/gsxToken/):
gsxToken: The platform token possesses a unique token economy, adopting a reward-penalty system, where different users are assigned different levels of reward and penalty rates. Additionally, the protocol governing the platform token is upgradeable.
   - Rewards： Distribution of dividends based on the fees collected from other users' transactions.
       - 1、Each user transaction will contribute a portion of tokens to the total dividend pool for distribution.
       - 2、Holders of the token do not need to take any action; simply when other users transact, the balance in their wallets will increase.

   - Punishment： Punishment based on different account level fee rates.
       - 1、A portion of the transaction volume is used to add liquidity.
       - 2、A portion of the transaction volume is used for the ecosystem.
       - 3、A portion of the transaction volume is distributed to holders.
       - 4、A portion of the transaction volume is burned.

## User flow
1. Users deposit tokens configured for liquidity provision into the Vault. Based on the corresponding token price, GLP tokens are allocated to users and staked to obtain esGSX.
2. After providing liquidity, users can engage in corresponding long or short trades.
3. If users wish to engage in spot trading, they can also conduct spot aggregated trading through the aggregator protocol interface by transferring tokens to the Aggregator Router. The protocol calculates the best route for exchange based on backend API.
4. When users provide liquidity, they stake GLP and receive esGSX. Users need to use the claim interface to claim rewards. The claimed esGMX can also be staked in the vester to exchange for GSX.


## Summary

A decentralized exchange supporting spot aggregated trading, with the platform token serving as a reward-penalty token, featuring two different economic logics of reward and penalty.

## config

[Protocol-related configuration](./docs/config.md)

# Getting Started

## Requirements

- [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
  - You'll know you did it right if you can run `git --version` and you see a response like `git version x.x.x`
- [hardhat](https://hardhat.org/)
  - You'll know you did it right if you can run `hardhat --version` and you see a response like `x.x.x`

## Quickstart

```
git clone http://2550es3110.wicp.vip/gsx/contract/gsxdexcontract/-/tree/master/contracts
cd GSX-V1
npm install
npx hardhat test  // test
npx hardhat run scripts/deploy/deployAggregationRouter.js --network bscTEST // deploy aggregation protocol
npx hardhat run scripts/deploy/deployFutureMain.js --network bscTEST // deploy dex protocol
npx hardhat run scripts/deploy/tokens.js --network bscTEST // deploy platform-token protocol
```

# Usage

## Testing

```
// Set the `url` environment variable with the URL of a mainnet RPC node. It's used for tests that fork Ethereum mainnet state.
 hardhat: {
      forking: {
        url: "",
        blockNumber: 19024848
      }
    },
```

Then run:

```
npx hardhat test
```

### Test Coverage

```
npx hardhat coverage
```



# Audit Scope Details

- Solc Version: [DEX--](./contracts/dex/)0.6.12、[Aggregator--](./contracts/aggregator)0.8.17、[GsxToken--](./contracts/gsxToken/)0.8.11
- Chain(s) to deploy contract to: BSC
- Tokens:
  - weth: https://bscscan.com/token/0x2170ed0880ac9a755fd29b2688956bd959f933f8
  - btcb: https://bscscan.com/token/0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c
  - link: https://bscscan.com/token/0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd
  - uni: https://bscscan.com/token/0xbf5140a22578168fd562dccf235e5d43a02ce9b1

  - usdc: https://bscscan.com/token/0x8965349fb649a33a30cbfda057d8ec2c48abe2a2
  - usdt: https://bscscan.com/token/0x55d398326f99059ff775485246999027b3197955
  - dai: https://bscscan.com/token/0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3
  - frax: https://bscscan.com/token/0x90C97F71E18723b0Cf0dfa30ee176Ab653E89F40

# Known issues 
- We are aware that USDC、USDT is behind a proxy and is susceptible to being paused and upgraded. Please assume for this audit that is not the case.  

"# GSX_DEX_Audit" 

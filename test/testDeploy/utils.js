const { bigNumberify, expandDecimals, getBlockTime, getPriceBits } = require("../shared/utilities")

async function printPositionLength(positionRuoter) {
    const queueLengths = await positionRuoter.getRequestQueueLengths()
  
    console.log("increasePositionRequestKeysStart : ", queueLengths[0].toString())
    console.log("increasePositionRequestKeys.length : ", queueLengths[1].toString())
    console.log("decreasePositionRequestKeysStart : ", queueLengths[2].toString())
    console.log("decreasePositionRequestKeys.length : ", queueLengths[3].toString())
  
  }

async function excutePositionOrder(user, wallet, key, positionRouter) {
    let key1 = await positionRouter.connect(user).getRequestKey(user.address, key)
    await positionRouter.connect(wallet).executeIncreasePosition(
        key1,
        wallet.address
    )
}

async function excutePositionOrderWithSetPrices(provider, wallet, prices, fastPriceFeed, positionRuoter, _endIndexForIncreasePositions, _endIndexForDecreasePositions, _maxIncreasePositions, _maxDecreasePositions) {
    const pricebits = getPriceBits(prices)
    const blockTime = await getBlockTime(provider)

    await fastPriceFeed.connect(wallet).setPricesWithBitsAndExecute(
            positionRuoter.address,
            pricebits, 
            blockTime,
            _endIndexForIncreasePositions, 
            _endIndexForDecreasePositions,
            _maxIncreasePositions, 
            _maxDecreasePositions 
    )
}

async function printPositionOrders(wallet, key, positionRouter) {
    let key1 = await positionRouter.getRequestKey(wallet.address, key)
    let request1 = await positionRouter.increasePositionRequests(key1)
    console.log("user1.仓位数据:",request1)
}

async function printPos(wallet, collateralToken, indexToken, isLong, vault) {
    const position = await vault.getPosition(wallet.address, collateralToken.address, indexToken.address, isLong);
    console.log("user1 position:", position)
}

const errors = [
    "Vault: zero error",
    "Vault: already initialized",
    "Vault: invalid _maxLeverage",
    "Vault: invalid _taxBasisPoints",
    "Vault: invalid _stableTaxBasisPoints",
    "Vault: invalid _mintBurnFeeBasisPoints",
    "Vault: invalid _swapFeeBasisPoints",
    "Vault: invalid _stableSwapFeeBasisPoints",
    "Vault: invalid _marginFeeBasisPoints",
    "Vault: invalid _liquidationFeeUsd",
    "Vault: invalid _fundingInterval",
    "Vault: invalid _fundingRateFactor",
    "Vault: invalid _stableFundingRateFactor",
    "Vault: token not whitelisted",
    "Vault: _token not whitelisted",
    "Vault: invalid tokenAmount",
    "Vault: _token not whitelisted",
    "Vault: invalid tokenAmount",
    "Vault: invalid usdgAmount",
    "Vault: _token not whitelisted",
    "Vault: invalid usdgAmount",
    "Vault: invalid redemptionAmount",
    "Vault: invalid amountOut",
    "Vault: swaps not enabled",
    "Vault: _tokenIn not whitelisted",
    "Vault: _tokenOut not whitelisted",
    "Vault: invalid tokens",
    "Vault: invalid amountIn",
    "Vault: leverage not enabled",
    "Vault: insufficient collateral for fees",
    "Vault: invalid position.size",
    "Vault: empty position",
    "Vault: position size exceeded",
    "Vault: position collateral exceeded",
    "Vault: invalid liquidator",
    "Vault: empty position",
    "Vault: position cannot be liquidated",
    "Vault: invalid position",
    "Vault: invalid _averagePrice",
    "Vault: collateral should be withdrawn",
    "Vault: _size must be more than _collateral",
    "Vault: invalid msg.sender",
    "Vault: mismatched tokens",
    "Vault: _collateralToken not whitelisted",
    "Vault: _collateralToken must not be a stableToken",
    "Vault: _collateralToken not whitelisted",
    "Vault: _collateralToken must be a stableToken",
    "Vault: _indexToken must not be a stableToken",
    "Vault: _indexToken not shortable",
    "Vault: invalid increase",
    "Vault: reserve exceeds pool",
    "Vault: max USDG exceeded",
    "Vault: reserve exceeds pool",
    "Vault: forbidden",
    "Vault: forbidden",
    "Vault: maxGasPrice exceeded"
  ]

module.exports = {
    excutePositionOrderWithSetPrices,
    printPositionLength,
    excutePositionOrder,
    printPositionOrders,
    printPos,
    errors
}
  
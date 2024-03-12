const { deployContract, deployContractWithLib , sendTxn, errors } = require("./shared/helpers")
const { expandDecimals } = require("../../test/shared/utilities")
const { toUsd } = require("../../test/shared/units")
const network = (process.env.HARDHAT_NETWORK || 'mainnet');

const tokens = require('./tokens')[network];
const orderBookConfig = require('./config/orderBookConfig')[network];
const fastPriceFeedConfig = require('./config/fastPriceFeedConfig')[network];
const gspManagerConfig = require('./config/gspManagerConfig')[network];
const positionConfig = require('./config/positionConfig')[network];
const priceFeedTimelockConfig = require('./config/priceFeedTimelockConfig')[network];
const shortsTrackerTimelockConfig = require('./config/shortsTrackerTimelockConfig')[network];
const timelockConfig = require('./config/timelockConfig')[network];
const gsxTimelockConfig = require('./config/gsxTimelockConfig')[network];

const tokenManagerConfig = require('./config/tokenManagerConfig')[network];
const vaultConfig = require('./config/vaultConfig')[network];
const vaultPriceFeedConfig = require('./config/vaultPriceFeedConfig')[network];
const vesterConfig = require('./config/vesterConfig')[network];
const {
  bscTestAddress
} = require("../deployments/new_address.json")


async function main() {
  // ******************
  // ** 初始化相关配置 **
  // ******************
  const tokenManagerSigners = tokenManagerConfig.Signers  
  const minAuthorizations = tokenManagerConfig.minAuthorizations  
  const priceFeedtimelockBuffer = priceFeedTimelockConfig.Buffer
  const priceFeedTimelockSigners = priceFeedTimelockConfig.Signers
  const priceFeedTimelockKeepers = priceFeedTimelockConfig.Keepers
  const timelockBuffer = timelockConfig.Buffer 
  const timelockHandlers = timelockConfig.Handlers 
  const timelockKeepers = timelockConfig.Keepers
  const maxTokenSupply = timelockConfig.maxTokenSupply 
  const timelockMarginFeeBasisPoints = timelockConfig.MarginFeeBasisPoints 
  const timelockMaxMarginFeeBasisPoints = timelockConfig.MaxMarginFeeBasisPoints 
  const shortsTrackerTimelockBuffer = shortsTrackerTimelockConfig.Buffer  
  const shortsTrackerTimelockUpdateDelay = shortsTrackerTimelockConfig.UpdateDelay
  const shortsTrackerTimelockHandlers = shortsTrackerTimelockConfig.Handlers
  const maxAveragePriceChange = shortsTrackerTimelockConfig.maxAveragePriceChange 
  const vestingDuration = vesterConfig.Duration  
  const fastPriceTokens = fastPriceFeedConfig.Tokens 
  const fastPriceFeedTokenMannager = fastPriceFeedConfig.Mannager
  const fastPriceFeedUpdaters = fastPriceFeedConfig.Updaters 
  const fastPriceFeedSigners = fastPriceFeedConfig.Signers 
  const fastPriceFeedPriceDuration = fastPriceFeedConfig.PriceDuration 
  const maxPriceUpdateDelay = fastPriceFeedConfig.maxPriceUpdateDelay 
  const minBlockInterval = fastPriceFeedConfig.minBlockInterval  
  const maxDeviationBasisPoints = fastPriceFeedConfig.maxDeviationBasisPoints 
  const fastPriceFeedMinAuthorizations = fastPriceFeedConfig.MinAuthorizations 
  const maxTimeDeviation = fastPriceFeedConfig.maxTimeDeviation 
  const spreadBasisPointsIfInactive = fastPriceFeedConfig.spreadBasisPointsIfInactive  
  const spreadBasisPointsIfChainError = fastPriceFeedConfig.spreadBasisPointsIfChainError 
  const PriceDataInterval = fastPriceFeedConfig.PriceDataInterval 
  const MaxStrictPriceDeviation = vaultPriceFeedConfig.MaxStrictPriceDeviation 
  const PriceSampleSpace = vaultPriceFeedConfig.PriceSampleSpace 
  const AmmEnabled = vaultPriceFeedConfig.AmmEnabled   
  const cooldownDuration = gspManagerConfig.cooldownDuration 
  const liquidationFeeUsd =  vaultConfig.liquidationFeeUsd 
  const fundingRateFactor = vaultConfig.fundingRateFactor 
  const stableFundingRateFactor = vaultConfig.stableFundingRateFactor  
  const fundingInterval = vaultConfig.fundingInterval 
  const taxBasisPoints = vaultConfig.taxBasisPoints  
  const stableTaxBasisPoints = vaultConfig.stableTaxBasisPoints 
  const swapFeeBasisPoints = vaultConfig.swapFeeBasisPoints  
  const stableSwapFeeBasisPoints = vaultConfig.stableSwapFeeBasisPoints 
  const mintBurnFeeBasisPoints = vaultConfig.mintBurnFeeBasisPoints  
  const marginFeeBasisPoints = vaultConfig.marginFeeBasisPoints  
  const minProfitTime = vaultConfig.minProfitTime 
  const hasDynamicFees = vaultConfig.hasDynamicFees 
  const positionMinExecutionFee = positionConfig.MinExecutionFee 
  const positionDepositFee = positionConfig.DepositFee
  const minBlockDelayKeeper = positionConfig.minBlockDelayKeeper
  const minTimeDelayPublic = positionConfig.minTimeDelayPublic  
  const orderBookMinExecutionFee = orderBookConfig.MinExecutionFee 
  const minPurchaseTokenAmountUsd = orderBookConfig.minPurchaseTokenAmountUsd 
  const tokenArr = [tokens.btc, tokens.eth, tokens.bnb, tokens.busd, tokens.usdc, tokens.usdt] // dex 支持的代币
  const nativeToken = tokens.nativeToken  // WETH
  const adminGov = bscTestAddress.admin

  const gsxTimelockBuffer = gsxTimelockConfig.Buffer
  const gsxLongTimelockBuffer = gsxTimelockConfig.longBuffer

  const gsxMaxTokenSupply = gsxTimelockConfig.gsxMaxTokenSupply

  const vault = await deployContract("Vault", [])
  const usdg = await deployContract("USDG", [vault.address])
  const router = await deployContract("Router", [vault.address, usdg.address, nativeToken.address])
  const vaultPriceFeed = await deployContract("VaultPriceFeed", [])
  // vaultPriceFeed 设置最大价格偏差
  await sendTxn(vaultPriceFeed.setMaxStrictPriceDeviation(MaxStrictPriceDeviation), "vaultPriceFeed.setMaxStrictPriceDeviation") 
  // 设置价格样本空间
  await sendTxn(vaultPriceFeed.setPriceSampleSpace(PriceSampleSpace), "vaultPriceFeed.setPriceSampleSpace")
  // 设置amm开关为false
  await sendTxn(vaultPriceFeed.setIsAmmEnabled(AmmEnabled), "vaultPriceFeed.setIsAmmEnabled")
  // 部署gsp
  const gsp = await deployContract("GSP", [])
  // 设置私人传输模式 为 true
  await sendTxn(gsp.setInPrivateTransferMode(true), "gsp.setInPrivateTransferMode")
  // 部署 shortsTracker
  const shortsTracker = await deployContract("ShortsTracker", [vault.address])
  await sendTxn(shortsTracker.setGov(adminGov), "shortsTracker.setGov")
  // 部署 gspManager
  const gspManager = await deployContract("GspManager", [vault.address, usdg.address, gsp.address, shortsTracker.address, cooldownDuration])
  // 设置私人模式为 true
  await sendTxn(gspManager.setInPrivateMode(true), "gspManager.setInPrivateMode")
  // 设置minter 为gspManger
  await sendTxn(gsp.setMinter(gspManager.address, true), "gsp.setMinter")
  // 为 usdg 添加 Vault 为 gspManager
  await sendTxn(usdg.addVault(gspManager.address), "usdg.addVault(gspManager)")
  // 初始化 vault
  await sendTxn(vault.initialize(
    router.address, // router
    usdg.address, // usdg
    vaultPriceFeed.address, // priceFeed
    liquidationFeeUsd, // liquidationFeeUsd
    fundingRateFactor, // fundingRateFactor
    stableFundingRateFactor // stableFundingRateFactor
  ), "vault.initialize")
  // 设置资金费用
  await sendTxn(vault.setFundingRate(fundingInterval, fundingRateFactor, stableFundingRateFactor), "vault.setFundingRate")
  // 设置为管理模式
  await sendTxn(vault.setInManagerMode(true), "vault.setInManagerMode")
  // 设置管理者为gspMannager
  await sendTxn(vault.setManager(gspManager.address, true), "vault.setManager")
  // 设置费用
  await sendTxn(vault.setFees(
    taxBasisPoints, // _taxBasisPoints
    stableTaxBasisPoints, // _stableTaxBasisPoints
    mintBurnFeeBasisPoints, // _mintBurnFeeBasisPoints
    swapFeeBasisPoints, // _swapFeeBasisPoints
    stableSwapFeeBasisPoints, // _stableSwapFeeBasisPoints
    marginFeeBasisPoints, // _marginFeeBasisPoints
    liquidationFeeUsd, // _liquidationFeeUsd
    minProfitTime, // _minProfitTime
    hasDynamicFees // _hasDynamicFees
  ), "vault.setFees")
  // 部署错误控制合约
  const vaultErrorController = await deployContract("VaultErrorController", [])
  // vault 设置控制合约
  await sendTxn(vault.setErrorController(vaultErrorController.address), "vault.setErrorController")
  // vaultErrorController 设置 vault  
  await sendTxn(vaultErrorController.setErrors(vault.address, errors), "vaultErrorController.setErrors")

  const tokenManager = await deployContract("TokenManager", [minAuthorizations], "TokenManager")

  await sendTxn(tokenManager.initialize(tokenManagerSigners), "tokenManager.initialize")

  const priceFeedTimelock = await deployContract("PriceFeedTimelock", [adminGov, priceFeedtimelockBuffer, tokenManager.address])


  for (let i = 0; i < priceFeedTimelockSigners.length; i++) {
    const signer = priceFeedTimelockSigners[i]
    await sendTxn(priceFeedTimelock.setContractHandler(signer, true), `deployedTimelock.setContractHandler(${signer})`)
  }

  for (let i = 0; i < priceFeedTimelockKeepers.length; i++) {
    const keeper = priceFeedTimelockKeepers[i]
    await sendTxn(priceFeedTimelock.setKeeper(keeper, true), `deployedTimelock.setKeeper(${keeper})`)
  }


  let shortsTrackerTimelock = await deployContract("ShortsTrackerTimelock", [adminGov, shortsTrackerTimelockBuffer, shortsTrackerTimelockUpdateDelay, maxAveragePriceChange])
  for (const handler of shortsTrackerTimelockHandlers) {
    await sendTxn(
      shortsTrackerTimelock.setContractHandler(handler, true),
      `shortsTrackerTimelock.setContractHandler ${handler}`
    )
  }
 
  const referralStorage = await deployContract("ReferralStorage", [])
  const gsx = await deployContract("GSX", [])
  const esGsx = await deployContract("EsGSX", [])

  await sendTxn(esGsx.setInPrivateTransferMode(true), "esGsx.setInPrivateTransferMode")
  await sendTxn(gsp.setInPrivateTransferMode(true), "gsp.setInPrivateTransferMode")

  const feeGspTracker = await deployContract("RewardTracker", ["Fee GSP", "fGSP"])
  const feeGspDistributor = await deployContract("RewardDistributor", [nativeToken.address, feeGspTracker.address])
  await sendTxn(feeGspTracker.initialize([gsp.address], feeGspDistributor.address), "feeGspTracker.initialize")
  await sendTxn(feeGspDistributor.updateLastDistributionTime(), "feeGspDistributor.updateLastDistributionTime")

  const stakedGspTracker = await deployContract("RewardTracker", ["Fee + Staked GSP", "fsGSP"])
  const stakedGspDistributor = await deployContract("RewardDistributor", [esGsx.address, stakedGspTracker.address])
  await sendTxn(stakedGspTracker.initialize([feeGspTracker.address], stakedGspDistributor.address), "stakedGspTracker.initialize")
  await sendTxn(stakedGspDistributor.updateLastDistributionTime(), "stakedGspDistributor.updateLastDistributionTime")

  await sendTxn(feeGspTracker.setInPrivateTransferMode(true), "feeGspTracker.setInPrivateTransferMode")
  await sendTxn(feeGspTracker.setInPrivateStakingMode(true), "feeGspTracker.setInPrivateStakingMode")
  await sendTxn(stakedGspTracker.setInPrivateTransferMode(true), "stakedGspTracker.setInPrivateTransferMode")
  await sendTxn(stakedGspTracker.setInPrivateStakingMode(true), "stakedGspTracker.setInPrivateStakingMode")

  const gspVester = await deployContract("Vester", [
    "Vested GSP", // _name
    "vGSP", // _symbol
    vestingDuration, // _vestingDuration
    esGsx.address, // _esToken
    stakedGspTracker.address, // _pairToken
    gsx.address, // _claimableToken
    stakedGspTracker.address, // _rewardTracker
  ])

  const rewardRouter = await deployContract("RewardRouterV2", [])
  await sendTxn(rewardRouter.initialize(
    nativeToken.address,
    gsx.address,
    esGsx.address,
    gsp.address,
    feeGspTracker.address,
    stakedGspTracker.address,
    gspManager.address,
    gspVester.address
  ), "rewardRouter.initialize")

  await sendTxn(gspManager.setHandler(rewardRouter.address, true), "gspManager.setHandler(rewardRouter)")
  // allow stakedGspTracker to stake feeGspTracker
  await sendTxn(feeGspTracker.setHandler(stakedGspTracker.address, true), "feeGspTracker.setHandler(stakedGspTracker)")
  // allow feeGspTracker to stake gsp
  await sendTxn(gsp.setHandler(feeGspTracker.address, true), "gsp.setHandler(feeGspTracker)")
  // allow rewardRouter to stake in feeGspTracker
  await sendTxn(feeGspTracker.setHandler(rewardRouter.address, true), "feeGspTracker.setHandler(rewardRouter)")
  // allow rewardRouter to stake in stakedGspTracker
  await sendTxn(stakedGspTracker.setHandler(rewardRouter.address, true), "stakedGspTracker.setHandler(rewardRouter)")
  await sendTxn(esGsx.setHandler(rewardRouter.address, true), "esGsx.setHandler(rewardRouter)")
  await sendTxn(esGsx.setHandler(stakedGspDistributor.address, true), "esGsx.setHandler(stakedGspDistributor)")
  await sendTxn(esGsx.setHandler(stakedGspTracker.address, true), "esGsx.setHandler(stakedGspTracker)")
  await sendTxn(esGsx.setHandler(gspVester.address, true), "esGsx.setHandler(gspVester)")
  await sendTxn(esGsx.setMinter(gspVester.address, true), "esGsx.setMinter(gspVester)")
  await sendTxn(gspVester.setHandler(rewardRouter.address, true), "gspVester.setHandler(rewardRouter)")
  await sendTxn(stakedGspTracker.setHandler(gspVester.address, true), "stakedGspTracker.setHandler(gspVester)")

  const timelock = await deployContract("Timelock", [
    admin,                // admin
    timelockBuffer,       // buffer
    tokenManager.address, // tokenManager
    tokenManager.address, // mintReceiver
    gspManager.address,   // gspManager
    rewardRouter.address, // rewardRouter
    maxTokenSupply,       // maxTokenSupply
    timelockMarginFeeBasisPoints, // marginFeeBasisPoints 0.1%
    timelockMaxMarginFeeBasisPoints // maxMarginFeeBasisPoints 5%
  ], "Timelock")

  const gsxTimelock = await deployContract("GsxTimelock", [
    admin, // admin
    gsxTimelockBuffer,    // buffer
    gsxLongTimelockBuffer, // longBuffer
    rewardRouter.address, // rewardManager
    tokenManager.address,   // tokenManager
    tokenManager.address, // mintReceiver
    gsxMaxTokenSupply  // maxTokenSupply
  ], "gsxTimelock")

  await sendTxn(timelock.setShouldToggleIsLeverageEnabled(true), "deployedTimelock.setShouldToggleIsLeverageEnabled(true)")

  for (let i = 0; i < timelockHandlers.length; i++) {
    const handler = timelockHandlers[i]
    await sendTxn(timelock.setContractHandler(handler, true), `deployedTimelock.setContractHandler(${handler})`)
  }

  for (let i = 0; i < timelockKeepers.length; i++) {
    const keeper = timelockKeepers[i]
    await sendTxn(timelock.setKeeper(keeper, true), `deployedTimelock.setKeeper(${keeper})`)
  }

  const positionRouterArgs = [vault.address, router.address, nativeToken.address, shortsTracker.address, positionDepositFee, positionMinExecutionFee]

  const positionRouter = await deployContractWithLib("PositionRouter", positionRouterArgs)

  await sendTxn(positionRouter.setReferralStorage(referralStorage.address), "positionRouter.setReferralStorage")
  await sendTxn(timelock.signalSetHandler(referralStorage.address, positionRouter.address, true), "referralStorage.signalSetHandler(positionRouter)")
  await sendTxn(shortsTrackerTimelock.signalSetHandler(positionRouter.address, true), "shortsTrackerTimelock.signalSetHandler(positionRouter)")
  await sendTxn(router.addPlugin(positionRouter.address), "router.addPlugin")
  await sendTxn(positionRouter.setDelayValues(minBlockDelayKeeper, minTimeDelayPublic, maxTimeDelay), "positionRouter.setDelayValues")
  await sendTxn(timelock.setContractHandler(positionRouter.address, true), "timelock.setContractHandler(positionRouter)")
  await sendTxn(positionRouter.setAdmin(adminGov), "positionRouter.setAdmin")

  if (fastPriceTokens.find(t => !t.fastPricePrecision)) {
    throw new Error("Invalid price precision")
  }

  if (fastPriceTokens.find(t => !t.maxCumulativeDeltaDiff)) {
    throw new Error("Invalid price maxCumulativeDeltaDiff")
  }
  const fastPriceEvents = await deployContract("FastPriceEvents", [])

  const secondaryPriceFeed = await deployContract("FastPriceFeed", [
    fastPriceFeedPriceDuration, // _priceDuration
    maxPriceUpdateDelay,        // _maxPriceUpdateDelay
    minBlockInterval,           // _minBlockInterval
    maxDeviationBasisPoints,    // _maxDeviationBasisPoints
    fastPriceEvents.address,    // _fastPriceEvents
    fastPriceFeedTokenMannager  // _tokenManager
  ])
  await sendTxn(vaultPriceFeed.setSecondaryPriceFeed(secondaryPriceFeed.address), "vaultPriceFeed.setSecondaryPriceFeed")

  for (const [i, tokenItem] of tokenArr.entries()) {
    if (tokenItem.spreadBasisPoints === undefined) { continue }
    await sendTxn(vaultPriceFeed.setSpreadBasisPoints(
      tokenItem.address, // _token
      tokenItem.spreadBasisPoints // _spreadBasisPoints
    ), `vaultPriceFeed.setSpreadBasisPoints(${tokenItem.name}) ${tokenItem.spreadBasisPoints}`)
  }
  for (const token of tokenArr) {
    await sendTxn(vaultPriceFeed.setTokenConfig(
      token.address, // _token
      token.priceFeed, // _priceFeed
      token.priceDecimals, // _priceDecimals
      token.isStrictStable // _isStrictStable
    ), `vaultPriceFeed.setTokenConfig(${token.name}) ${token.address} ${token.priceFeed}`)
    await sendTxn(vault.setTokenConfig(
      token.address, // _token
      token.decimals, // _tokenDecimals
      token.tokenWeight, // _tokenWeight
      token.minProfitBps, // _minProfitBps
      expandDecimals(token.maxUsdgAmount, 18), // _maxUsdgAmount
      token.isStable, // _isStable
      token.isShortable // _isShortable
    ), `vault.setTokenConfig(${token.name}) ${token.address} ${token.priceFeed}`)
  }
  // 设置 FastPriceFeed 合约 初始化
  await sendTxn(secondaryPriceFeed.initialize(fastPriceFeedMinAuthorizations, fastPriceFeedSigners, fastPriceFeedUpdaters), "secondaryPriceFeed.initialize")
  await sendTxn(secondaryPriceFeed.setTokens(fastPriceTokens.map(t => t.address), fastPriceTokens.map(t => t.fastPricePrecision)), "secondaryPriceFeed.setTokens")
  await sendTxn(secondaryPriceFeed.setVaultPriceFeed(vaultPriceFeed.address), "secondaryPriceFeed.setVaultPriceFeed")
  await sendTxn(secondaryPriceFeed.setMaxTimeDeviation(maxTimeDeviation), "secondaryPriceFeed.setMaxTimeDeviation")
  await sendTxn(secondaryPriceFeed.setSpreadBasisPointsIfInactive(spreadBasisPointsIfInactive), "secondaryPriceFeed.setSpreadBasisPointsIfInactive")
  await sendTxn(secondaryPriceFeed.setSpreadBasisPointsIfChainError(spreadBasisPointsIfChainError), "secondaryPriceFeed.setSpreadBasisPointsIfChainError")
  
  await sendTxn(secondaryPriceFeed.setMaxCumulativeDeltaDiffs(fastPriceTokens.map(t => t.address), fastPriceTokens.map(t => t.maxCumulativeDeltaDiff)), "secondaryPriceFeed.setMaxCumulativeDeltaDiffs")
  await sendTxn(secondaryPriceFeed.setPriceDataInterval(PriceDataInterval), "secondaryPriceFeed.setPriceDataInterval")
  
  await sendTxn(positionRouter.setPositionKeeper(secondaryPriceFeed.address, true), "positionRouter.setPositionKeeper(secondaryPriceFeed)")
  await sendTxn(fastPriceEvents.setIsPriceFeed(secondaryPriceFeed.address, true), "fastPriceEvents.setIsPriceFeed")
  
  await sendTxn(vaultPriceFeed.setGov(priceFeedTimelock.address), "vaultPriceFeed.setGov")  // 未执行, 留
  await sendTxn(secondaryPriceFeed.setGov(priceFeedTimelock.address), "secondaryPriceFeed.setGov")  // 未执行, 留
  await sendTxn(secondaryPriceFeed.setTokenManager(tokenManager.address), "secondaryPriceFeed.setTokenManager") // 未执行, 留
  await vault.setGov(timelock.address)

  const orderBook = await deployContract("OrderBook", []);

  // Arbitrum mainnet addresses
  await sendTxn(orderBook.initialize(
    router.address, // router
    vault.address, // vault
    nativeToken.address, // weth
    usdg.address, // usdg
    orderBookMinExecutionFee, // 0.001 bnb
    minPurchaseTokenAmountUsd // min purchase token amount usd
  ), "orderBook.initialize");
  
  await sendTxn(router.addPlugin(orderBook.address), "router.addPlugin")

  const reader = await deployContract("Reader", [], "Reader")
  await sendTxn(reader.setConfig(true), "Reader.setConfig")

  await deployContract("OrderBookReader", [])
  await deployContract("RewardReader", [], "RewardReader")
  await deployContract("VaultReader", [], "VaultReader")
  await sendTxn(positionRouter.setGov(await vault.gov()), "positionRouter.setGov")
  await sendTxn(positionManager.setGov(await vault.gov()), "positionManager.setGov")

  const distributor0 = await deployContract("TimeDistributor", [])
  const yieldTracker0 = await deployContract("YieldTracker", [usdg.address])

  await sendTxn(yieldTracker0.setDistributor(distributor0.address), "yieldTracker0.setDistributor")
  await sendTxn(distributor0.setDistribution([yieldTracker0.address], [1000], [nativeToken.address]), "distributor0.setDistribution")
  await deployContract("GspBalance", [gspManager.address, stakedGspTracker.address])

  }
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

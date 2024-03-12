const { deployContract } = require("../../scripts/deploy/shared/helpers")

const { expandDecimals } = require("../shared/utilities")
const { toUsd } = require("../shared/units")

const { excutePositionOrder, printPositionLength, printPositionOrders, errors } = require("./utils")
const networks = (process.env.HARDHAT_NETWORK || 'mainnet');
const tokens = require('./tokens')[networks];

async function setApproveUserPlugin(user1, router, positionRouter) {
  var isUserRouterPlugin = await router.connect(user1).approvedPlugins(user1.address, positionRouter.address)
  if (!isUserRouterPlugin) {
    await router.connect(user1).approvePlugin(positionRouter.address)
    isUserRouterPlugin = await router.connect(user1).approvedPlugins(user1.address, positionRouter.address)
  }
  console.log("user1 可以使用这个 positionRuoter.router 的插件: ", isUserRouterPlugin)

}


describe("Vault.settings", function () {

  let vault
  let rewardRouter
  let gspManager
  let positionRouter
  let positionMinExecutionFee
  let router
  let secondaryPriceFeed
  let timelock
  let referralStorage

  let USDT
  let USDT_ADDRESS = "0xdac17f958d2ee523a2206206994597c13d831ec7"
  let USDT_HOLDER = "0xf977814e90da44bfa03b6295a0616a897441acec";

  let BTC
  let BTC_ADDRESS = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
  let BTC_HOLDER = "0x6daB3bCbFb336b29d06B9C793AEF7eaA57888922"


  let WETH 
  let WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  let WETH_HOLDER = "0x2feb1512183545f48f6b9c5b4ebfcaf49cfca6f3"

  let provider = waffle.provider
  let [wallet] = provider.getWallets()
  const { AddressZero } = ethers.constants

  beforeEach(async () => {
    const beginBalance = await provider.getBalance(wallet.address);
    console.log("eth balance: ", beginBalance.toString())
    admin = wallet.address
    // ******************
    // ** 初始化相关配置 **
    // ******************
    // ------ tokenManafer 配置
    const tokenManagerSigners = [admin]  // tokenManafer 合约 签名者
    const minAuthorizations = 1  // tokenManafer 最小授权数

    // ------ PriceFeedTimelock 配置
    const priceFeedtimelockBuffer = 24 * 60 * 60  // PriceFeedTimelock 解锁时间
    const priceFeedTimelockSigners = [admin]
    const priceFeedTimelockKeepers = [admin]

    // ------ Timelock 配置
    const timelockBuffer = 24 * 60 * 60  // Timelock 解锁时间
    const timelockHandlers = [admin] // Timelock 合约 控制员
    const timelockKeepers = [admin] // Timelock 合约 Keepers
    const maxTokenSupply = expandDecimals("13250000", 18) // timeLock 合约 maxTokenSupply
    const timelockMarginFeeBasisPoints = 10  // 0.1% 跟vault 相关
    const timelockMaxMarginFeeBasisPoints = 500 // 5% 跟vault 相关

    // ------ shortsTrackerTimelock 配置
    const shortsTrackerTimelockBuffer =  60  // shortsTrackerTimelock合约 解锁时间
    const shortsTrackerTimelockUpdateDelay = 600  // ShortsTrackerTimelock合约 均价更新延迟
    const shortsTrackerTimelockHandlers = [admin]  // shortsTrackerTimelock 操控员
    const maxAveragePriceChange = 20 // 0.2 % shortsTrackerTimelock合约 最大平均价格变动
    
    // ----- vester 配置
    const vestingDuration = 60  // vester 解锁时间

    // ----- fastPriceFeed 配置
    const fastPriceTokens = [tokens.btc, tokens.eth] // fastPriceFeed 合约配置需喂价token
    const fastPriceFeedTokenMannager = admin // fastPriceFeed 管理员
    const fastPriceFeedUpdaters = [admin] // fastPriceFeed 喂价员
    const fastPriceFeedSigners = [admin] // fastPriceFeed 签名员
    const fastPriceFeedPriceDuration = 5 * 60 // 价格持续时间, 如果上次喂价时间超过这个限制, 那么取价时就对价格进行加点处理
    const maxPriceUpdateDelay = 60 * 60  // 价格更新延迟时间, 如果上次喂价时间超过这个限制, 那么取价时就对价格进行加点处理
    const minBlockInterval = 1  // 价格最小区块间隔, 喂价价格必须超过这个区块间隔
    const maxDeviationBasisPoints = 250 // 0.025 // 最大偏差基点  如果 referPrice 与 fastPrice 的价差比例超过了 这个限制, 那么就取最大价格(最小价格), 没超过, 就取 fastPrice
    const fastPriceFeedMinAuthorizations = 1 // 最小授权数
    const maxTimeDeviation = 60 * 60 // 最大时间偏差, 如果喂价时间撮 不在 前后 这个限制内, 价格喂不进去
    const spreadBasisPointsIfInactive = 50  // 如果不活跃则传播基点 0.5%
    const spreadBasisPointsIfChainError = 500 // 如果错误则传基点 5%
    const PriceDataInterval = 1 * 60 // 价格数据时间间隔 在这个时间内, 累计变化, 该变化不能超过一个值

    // ------ vaultPriceFeed 配置
    const MaxStrictPriceDeviation = expandDecimals(1, 28) // vaultPriceFeed 稳定币最大价格偏差 0.01
    const PriceSampleSpace = 1 // vaultPriceFeed 价格样本空间 
    const AmmEnabled = false   // vaultPriceFeed AMM 价格开关 

    // ------ GspManager 配置
    const cooldownDuration =  15 * 60 // GspManager合约 移除流动性冷去时间 

    // ------------- vault 配置
    const liquidationFeeUsd = toUsd(2) // vault 清算费用
    const fundingRateFactor = 100  // 非稳定币资金费率放大基础 
    const stableFundingRateFactor = 100 // 稳定币资金费率放大基础
    const fundingInterval = 60 * 60  // 资金费收取间隔时间
    const taxBasisPoints = 10    // swap 基本费率  0.1%
    const stableTaxBasisPoints = 5 // 稳定币 基本费率 0.05%
    const swapFeeBasisPoints = 20       // 非稳定币 swap 费率  0.2%
    const stableSwapFeeBasisPoints = 1  // 稳定币 swap 费率  0.01% 

    const mintBurnFeeBasisPoints = 20   // 添加移除流动性费率 0.2%
    const marginFeeBasisPoints = 10     // 开仓费率 0.1%
    const minProfitTime = 24 * 60 * 60  // 最低利润时间限制, 如果 minProfitTime 已过，则不会有最低利润阈值, 最低利润阈值有助于防止抢先交易问题
    const hasDynamicFees = true  // 是否有动态费用
    
    // -------------- position 配置
    positionMinExecutionFee = "2000000000000000" // 0.002 bnb
    const positionDepositFee = 30 // 0.3% 押金费率 
    const minBlockDelayKeeper = 0   // 最小块延迟值, 市价单下单超过最小区块限制, 才允许执行
    const minTimeDelayPublic = 180  // 最小时间延迟值, 市价单下单超过最小时间限制, 才允许执行
    const maxTimeDelay = 30 * 60  // 最大时间延迟值, 市价单下单未超过最大时间限制, 才允许执行
    // -------------- orderBook 配置
    const orderBookMinExecutionFee = "2000000000000000" // 0.002 bnb
    const minPurchaseTokenAmountUsd = expandDecimals(10, 30) // 最小购买代币金额 10 U, 最小做多做空 保证金价值
    // ------------- positionManager 配置
    const depositFee = 50
    const partnerContracts = []
    const orderKeepers = [admin]
    const liquidators = [admin]
    // ------ 公共配置
    const tokenArr = [tokens.btc, tokens.eth, tokens.usdc, tokens.usdt] // dex 支持的代币
    const nativeToken = tokens.nativeToken  // WETH
    const adminGov = admin

    const gsxTimelockBuffer = 5 * 24 * 60 * 60
    const gsxMaxTokenSupply =  expandDecimals("13250000", 18)

  
    // *********************
    // ********************* 
    vault = await deployContract("Vault", [])
    const usdg = await deployContract("USDG", [vault.address])
    router = await deployContract("Router", [vault.address, usdg.address, nativeToken.address])
    const vaultPriceFeed = await deployContract("VaultPriceFeed", [])
    // vaultPriceFeed 设置最大价格偏差
    await vaultPriceFeed.setMaxStrictPriceDeviation(MaxStrictPriceDeviation)
    // 设置价格样本空间
    await vaultPriceFeed.setPriceSampleSpace(PriceSampleSpace)
    // 设置amm开关为false
    await vaultPriceFeed.setIsAmmEnabled(AmmEnabled)
    // 部署gsp
    const gsp = await deployContract("GSP", [])
    // 设置私人传输模式 为 true
    await gsp.setInPrivateTransferMode(true)
    // 部署 shortsTracker
    const shortsTracker = await deployContract("ShortsTracker", [vault.address])
    await shortsTracker.setGov(adminGov)
    gspManager = await deployContract("GspManager", [
      vault.address, 
      usdg.address, 
      gsp.address, 
      shortsTracker.address, 
      cooldownDuration
    ])
    await gspManager.setInPrivateMode(true)
    await gsp.setMinter(gspManager.address, true)
    await usdg.addVault(gspManager.address)
    await vault.initialize(
      router.address, // router
      usdg.address, // usdg
      vaultPriceFeed.address, // priceFeed
      liquidationFeeUsd, // liquidationFeeUsd
      fundingRateFactor, // fundingRateFactor
      stableFundingRateFactor // stableFundingRateFactor
    )
    await vault.setFundingRate(fundingInterval, fundingRateFactor, stableFundingRateFactor)
    await vault.setInManagerMode(true)
    await vault.setManager(gspManager.address, true)
    await vault.setFees(
      taxBasisPoints, // _taxBasisPoints
      stableTaxBasisPoints, // _stableTaxBasisPoints
      mintBurnFeeBasisPoints, // _mintBurnFeeBasisPoints
      swapFeeBasisPoints, // _swapFeeBasisPoints
      stableSwapFeeBasisPoints, // _stableSwapFeeBasisPoints
      marginFeeBasisPoints, // _marginFeeBasisPoints
      liquidationFeeUsd, // _liquidationFeeUsd
      minProfitTime, // _minProfitTime
      hasDynamicFees // _hasDynamicFees
    )
    const vaultErrorController = await deployContract("VaultErrorController", [])
    await vault.setErrorController(vaultErrorController.address)
    await vaultErrorController.setErrors(vault.address, errors)
    

    const tokenManager = await deployContract("TokenManager", [minAuthorizations], "TokenManager")
    await tokenManager.initialize(tokenManagerSigners)

    const priceFeedTimelock = await deployContract("PriceFeedTimelock", [adminGov, priceFeedtimelockBuffer, tokenManager.address])


    for (let i = 0; i < priceFeedTimelockSigners.length; i++) {
      const signer = priceFeedTimelockSigners[i]
      await priceFeedTimelock.setContractHandler(signer, true)
    }

    for (let i = 0; i < priceFeedTimelockKeepers.length; i++) {
      const keeper = priceFeedTimelockKeepers[i]
      await priceFeedTimelock.setKeeper(keeper, true)
    }

    let shortsTrackerTimelock = await deployContract("ShortsTrackerTimelock", [adminGov, shortsTrackerTimelockBuffer, shortsTrackerTimelockUpdateDelay, maxAveragePriceChange])
    for (const handler of shortsTrackerTimelockHandlers) {
      await shortsTrackerTimelock.setContractHandler(handler, true)
    }
  
    referralStorage = await deployContract("ReferralStorage", [])

    const gsx = await deployContract("GSX", [])

    const esGsx = await deployContract("EsGSX", [])

    await esGsx.setInPrivateTransferMode(true)
    await gsp.setInPrivateTransferMode(true)

    const feeGspTracker = await deployContract("RewardTracker", ["Fee GSP", "fGSP"])
    const feeGspDistributor = await deployContract("RewardDistributor", [nativeToken.address, feeGspTracker.address])
    await feeGspTracker.initialize([gsp.address], feeGspDistributor.address)
    await feeGspDistributor.updateLastDistributionTime()

    const stakedGspTracker = await deployContract("RewardTracker", ["Fee + Staked GSP", "fsGSP"])
    const stakedGspDistributor = await deployContract("RewardDistributor", [esGsx.address, stakedGspTracker.address])
    await stakedGspTracker.initialize([feeGspTracker.address], stakedGspDistributor.address)
    await stakedGspDistributor.updateLastDistributionTime()

    await feeGspTracker.setInPrivateTransferMode(true)
    await feeGspTracker.setInPrivateStakingMode(true)
    await stakedGspTracker.setInPrivateTransferMode(true)
    await stakedGspTracker.setInPrivateStakingMode(true)

    const gspVester = await deployContract("Vester", [
      "Vested GSP", // _name
      "vGSP", // _symbol
      vestingDuration, // _vestingDuration
      esGsx.address, // _esToken
      stakedGspTracker.address, // _pairToken
      gsx.address, // _claimableToken
      stakedGspTracker.address, // _rewardTracker
    ])

    rewardRouter = await deployContract("RewardRouterV2", [])
    await rewardRouter.initialize(
      nativeToken.address,
      gsx.address,
      esGsx.address,
      gsp.address,
      feeGspTracker.address,
      stakedGspTracker.address,
      gspManager.address,
      gspVester.address
    )

    await gspManager.setHandler(rewardRouter.address, true)
    // allow stakedGspTracker to stake feeGspTracker
    await feeGspTracker.setHandler(stakedGspTracker.address, true)
    // allow feeGspTracker to stake gsp
    await gsp.setHandler(feeGspTracker.address, true)
    // allow rewardRouter to stake in feeGspTracker
    await feeGspTracker.setHandler(rewardRouter.address, true)
    // allow rewardRouter to stake in stakedGspTracker
    await stakedGspTracker.setHandler(rewardRouter.address, true)
    await esGsx.setHandler(rewardRouter.address, true)
    await esGsx.setHandler(stakedGspDistributor.address, true)
    await esGsx.setHandler(stakedGspTracker.address, true)
    await esGsx.setHandler(gspVester.address, true)
    await esGsx.setMinter(gspVester.address, true)
    await gspVester.setHandler(rewardRouter.address, true)
    await stakedGspTracker.setHandler(gspVester.address, true)


    timelock = await deployContract("Timelock", [
      admin, // admin
      timelockBuffer, // buffer
      tokenManager.address, // tokenManager
      tokenManager.address, // mintReceiver
      gspManager.address, // gspManager
      rewardRouter.address, // rewardRouter
      maxTokenSupply, // maxTokenSupply
      timelockMarginFeeBasisPoints, // marginFeeBasisPoints 0.1%
      timelockMaxMarginFeeBasisPoints // maxMarginFeeBasisPoints 5%
    ], "Timelock")

    const gsxTimelock = await deployContract("GsxTimelock", [
      admin, // admin
      gsxTimelockBuffer,    // buffer
      gsxTimelockBuffer,    // longBuffer
      rewardRouter.address, // rewardManager
      tokenManager.address,   // tokenManager
      tokenManager.address, // mintReceiver
      gsxMaxTokenSupply // maxTokenSupply
    ], "gsxTimelock")

    await timelock.setShouldToggleIsLeverageEnabled(true)

    for (let i = 0; i < timelockHandlers.length; i++) {
      const handler = timelockHandlers[i]
      await timelock.setContractHandler(handler, true)
    }

    for (let i = 0; i < timelockKeepers.length; i++) {
      const keeper = timelockKeepers[i]
      await timelock.setKeeper(keeper, true)
    }

    const positionRouterArgs = [vault.address, router.address, nativeToken.address, shortsTracker.address, positionDepositFee, positionMinExecutionFee]
    positionRouter = await deployContract("PositionRouter", positionRouterArgs)
    await referralStorage.setHandler(positionRouter.address, true)
    
    await positionRouter.setReferralStorage(referralStorage.address)

    await router.addPlugin(positionRouter.address)
    await positionRouter.setDelayValues(minBlockDelayKeeper, minTimeDelayPublic, maxTimeDelay)
    await timelock.setContractHandler(positionRouter.address, true)



    if (fastPriceTokens.find(t => !t.fastPricePrecision)) {
      throw new Error("Invalid price precision")
    }

    if (fastPriceTokens.find(t => !t.maxCumulativeDeltaDiff)) {
      throw new Error("Invalid price maxCumulativeDeltaDiff")
    }
    const fastPriceEvents = await deployContract("FastPriceEvents", [])

    secondaryPriceFeed = await deployContract("FastPriceFeed", [
      fastPriceFeedPriceDuration, // _priceDuration
      maxPriceUpdateDelay, // _maxPriceUpdateDelay
      minBlockInterval, // _minBlockInterval
      maxDeviationBasisPoints, // _maxDeviationBasisPoints
      fastPriceEvents.address, // _fastPriceEvents
      fastPriceFeedTokenMannager // _tokenManager
    ])

    await vaultPriceFeed.setSecondaryPriceFeed(secondaryPriceFeed.address)

    for (const [i, tokenItem] of tokenArr.entries()) {
      if (tokenItem.spreadBasisPoints === undefined) { continue }
      await vaultPriceFeed.setSpreadBasisPoints(
        tokenItem.address, // _token
        tokenItem.spreadBasisPoints // _spreadBasisPoints
      )
    }


    for (const token of tokenArr) {
      await vaultPriceFeed.setTokenConfig(
        token.address, // _token
        token.priceFeed, // _priceFeed
        token.priceDecimals, // _priceDecimals
        token.isStrictStable // _isStrictStable
      )
      await vault.setTokenConfig(
        token.address, // _token
        token.decimals, // _tokenDecimals
        token.tokenWeight, // _tokenWeight
        token.minProfitBps, // _minProfitBps
        expandDecimals(token.maxUsdgAmount, 18), // _maxUsdgAmount
        token.isStable, // _isStable
        token.isShortable // _isShortable
      )
    }

    // 设置 FastPriceFeed 合约 初始化
    await secondaryPriceFeed.initialize(fastPriceFeedMinAuthorizations, fastPriceFeedSigners, fastPriceFeedUpdaters)
    await secondaryPriceFeed.setTokens(fastPriceTokens.map(t => t.address), fastPriceTokens.map(t => t.fastPricePrecision))
    await secondaryPriceFeed.setVaultPriceFeed(vaultPriceFeed.address)
    await secondaryPriceFeed.setMaxTimeDeviation(maxTimeDeviation)
    await secondaryPriceFeed.setSpreadBasisPointsIfInactive(spreadBasisPointsIfInactive)
    await secondaryPriceFeed.setSpreadBasisPointsIfChainError(spreadBasisPointsIfChainError)

    await secondaryPriceFeed.setMaxCumulativeDeltaDiffs(fastPriceTokens.map(t => t.address), fastPriceTokens.map(t => t.maxCumulativeDeltaDiff))
    await secondaryPriceFeed.setPriceDataInterval(PriceDataInterval)
  
    await positionRouter.setPositionKeeper(secondaryPriceFeed.address, true)
    await fastPriceEvents.setIsPriceFeed(secondaryPriceFeed.address, true)

    await vaultPriceFeed.setGov(priceFeedTimelock.address) 
    await secondaryPriceFeed.setGov(priceFeedTimelock.address) 
    await secondaryPriceFeed.setTokenManager(tokenManager.address)
    await vault.setGov(timelock.address)
    // ************
    // ** 步骤十二 **
    // ************
    const orderBook = await deployContract("OrderBook", []);

    // Arbitrum mainnet addresses
    await orderBook.initialize(
      router.address, // router
      vault.address, // vault
      nativeToken.address, // weth
      usdg.address, // usdg
      orderBookMinExecutionFee, // 0.001 bnb
      minPurchaseTokenAmountUsd // min purchase token amount usd
    )
    
    await router.addPlugin(orderBook.address)
    

    const positionManager = await deployContract("PositionManager", [
      vault.address,
      router.address,
      shortsTracker.address,
      nativeToken.address,
      depositFee,
      orderBook.address
    ])

    await positionManager.setReferralStorage(referralStorage.address)
    await positionManager.setShouldValidateIncreaseOrder(false)
    
    for (let i = 0; i < orderKeepers.length; i++) {
      const orderKeeper = orderKeepers[i]
      await positionManager.setOrderKeeper(orderKeeper, true)
    }
    for (let i = 0; i < liquidators.length; i++) {
      const liquidator = liquidators[i]
      await positionManager.setLiquidator(liquidator, true)
    }

    await timelock.setContractHandler(positionManager.address, true)
    await timelock.setLiquidator(vault.address, positionManager.address, true)
    await shortsTracker.setHandler(positionManager.address, true)
    await router.addPlugin(positionManager.address)
    
    for (let i = 0; i < partnerContracts.length; i++) {
      const partnerContract = partnerContracts[i]
      await positionManager.setPartner(partnerContract, true)
    }


    const reader = await deployContract("Reader", [], "Reader")
    await reader.setConfig(true)

    await deployContract("OrderBookReader", [])
    await deployContract("RewardReader", [], "RewardReader")
    await deployContract("VaultReader", [], "VaultReader")
    await positionRouter.setGov(await vault.gov())
    await positionManager.setGov(await vault.gov())
    
    const distributor0 = await deployContract("TimeDistributor", [])
    const yieldTracker0 = await deployContract("YieldTracker", [usdg.address])
  
    await yieldTracker0.setDistributor(distributor0.address)
    await distributor0.setDistribution([yieldTracker0.address], [1000], [nativeToken.address])
    await deployContract("GspBalance", [gspManager.address, stakedGspTracker.address])

    const overBalance = await provider.getBalance(wallet.address);
    console.log("eth balance: ", overBalance.toString())

    // *******************************

    // ###############################
    const USDT_ABI = require("./abi/usdt_abi.json");
    const BTC_ABI = require("./abi/btc_abi.json");
    const WETH_ABI = require("./abi/weth_abi.json");
    BTC = new ethers.Contract(BTC_ADDRESS, BTC_ABI, ethers.provider);          
    USDT = new ethers.Contract(USDT_ADDRESS, USDT_ABI, ethers.provider);
    WETH = new ethers.Contract(WETH_ADDRESS, WETH_ABI, ethers.provider);     

    // 将binance 的 USDT 代币转移到 user1
    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [USDT_HOLDER],
    });
    const usdt_holder_signer = await ethers.provider.getSigner(USDT_HOLDER);
    const tx1 = await USDT.connect(usdt_holder_signer).transfer(wallet.address, expandDecimals(1000, 6));
    await tx1.wait();

    // 将 某 的 BTC 代币转移到user1
    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [BTC_HOLDER],
    });

    const btc_holder_signer = await ethers.provider.getSigner(BTC_HOLDER);
    const tx2 = await BTC.connect(btc_holder_signer).transfer(wallet.address, expandDecimals(1000, 8));
    await tx2.wait();

    // 将holder的  WETH 转移到 user1
    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [WETH_HOLDER],
    });

    const weth_holder_signer = await ethers.provider.getSigner(WETH_HOLDER);
    const tx4 = await WETH.connect(weth_holder_signer).transfer(wallet.address, expandDecimals(1000, 18));
    await tx4.wait();
  })

  // it("vault get price", async () => {
  //     const btcPrice = await vault.getMaxPrice(tokens.btc.address)
  //     console.log("btc price:", btcPrice.toString())

  //     const ethPrice = await vault.getMaxPrice(tokens.eth.address)
  //     console.log("eth price:", ethPrice.toString())
      
  //     const usdtPrice =await vault.getMaxPrice(tokens.usdt.address)
  //     console.log("usdt price:", usdtPrice.toString())

  //     const usdcPrice =await vault.getMaxPrice(tokens.usdc.address)
  //     console.log("usdc price:", usdcPrice.toString())

  // })

  it("add liquidity staked gsp", async () => {
      // console.log(122112)
      // // ------------ 添加流动性
      const mintAndStakeGspParams = [
        tokens.btc.address,   // _token
        expandDecimals(2, 8), // _amount
        0,                     // _minUsdg
        0                      // _minGsp
      ]
      await BTC.connect(wallet).approve(gspManager.address, expandDecimals(2, 8))
      await rewardRouter.connect(wallet).mintAndStakeGsp(...mintAndStakeGspParams)
      // -------------- 做多
      const ethLongParams = [
        [tokens.btc.address], // _path
        tokens.btc.address, // _indexToken
        expandDecimals(1, 8), // _amountIn
        expandDecimals(1, 8), // _minOut
        toUsd(60000), // _sizeDelta
        true, // _isLong
        toUsd(56497221000000), // _acceptablePrice
      ]
      const referralCode = "0x0000000000000000000000000000000000000000000000000000000000000123"
      const weth = await positionRouter.weth()
      await setApproveUserPlugin(wallet, router, positionRouter)
      await BTC.connect(wallet).approve(router.address, expandDecimals(1, 8))
      await positionRouter.connect(wallet).createIncreasePosition(...ethLongParams.concat([positionMinExecutionFee, referralCode, AddressZero], { value: positionMinExecutionFee }))

      await printPositionOrders(wallet, 1, positionRouter)

      await printPositionLength(positionRouter)
      await excutePositionOrder(wallet, wallet, 1, positionRouter)  
      await excutePositionOrderWithSetPrices(provider, wallet, [40000000, 1000000], secondaryPriceFeed, positionRouter, 1, 0, 1, 0)
      await printPositionLength(positionRouter)
  })
})



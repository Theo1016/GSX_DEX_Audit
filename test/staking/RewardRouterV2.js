const { expect, use } = require("chai")
const { solidity } = require("ethereum-waffle")
const { deployContract } = require("../shared/fixtures")
const { expandDecimals, getBlockTime, increaseTime, mineBlock, reportGasUsed, print, newWallet } = require("../shared/utilities")
const { toChainlinkPrice } = require("../shared/chainlink")
const { toUsd, toNormalizedPrice } = require("../shared/units")
const { initVault, getBnbConfig, getBtcConfig, getDaiConfig } = require("../core/Vault/helpers")

use(solidity)

describe("RewardRouterV2", function () {
  const provider = waffle.provider
  const [wallet, user0, user1, user2, user3, user4, tokenManager] = provider.getWallets()

  const vestingDuration = 365 * 24 * 60 * 60

  let timelock

  let vault
  let gspManager
  let gsp
  let usdg
  let router
  let vaultPriceFeed
  let bnb
  let bnbPriceFeed
  let btc
  let btcPriceFeed
  let eth
  let ethPriceFeed
  let dai
  let daiPriceFeed
  let busd
  let busdPriceFeed

  let gsx
  let esGsx

  let feeGspTracker
  let feeGspDistributor
  let stakedGspTracker
  let stakedGspDistributor

  let gspVester

  let rewardRouter

  beforeEach(async () => {
    bnb = await deployContract("Token", [])
    bnbPriceFeed = await deployContract("PriceFeed", [])

    btc = await deployContract("Token", [])
    btcPriceFeed = await deployContract("PriceFeed", [])

    eth = await deployContract("Token", [])
    ethPriceFeed = await deployContract("PriceFeed", [])

    dai = await deployContract("Token", [])
    daiPriceFeed = await deployContract("PriceFeed", [])

    busd = await deployContract("Token", [])
    busdPriceFeed = await deployContract("PriceFeed", [])

    vault = await deployContract("Vault", [])
    usdg = await deployContract("USDG", [vault.address])
    router = await deployContract("Router", [vault.address, usdg.address, bnb.address])
    vaultPriceFeed = await deployContract("VaultPriceFeed", [])
    gsp = await deployContract("GSP", [])

    await initVault(vault, router, usdg, vaultPriceFeed)
    gspManager = await deployContract("GspManager", [vault.address, usdg.address, gsp.address, ethers.constants.AddressZero, 24 * 60 * 60])

    timelock = await deployContract("Timelock", [
      wallet.address, // _admin
      10, // _buffer
      tokenManager.address, // _tokenManager
      tokenManager.address, // _mintReceiver
      gspManager.address, // _gspManager
      user0.address, // _rewardRouter
      expandDecimals(1000000, 18), // _maxTokenSupply
      10, // marginFeeBasisPoints
      100 // maxMarginFeeBasisPoints
    ])

    await vaultPriceFeed.setTokenConfig(bnb.address, bnbPriceFeed.address, 8, false)
    await vaultPriceFeed.setTokenConfig(btc.address, btcPriceFeed.address, 8, false)
    await vaultPriceFeed.setTokenConfig(eth.address, ethPriceFeed.address, 8, false)
    await vaultPriceFeed.setTokenConfig(dai.address, daiPriceFeed.address, 8, false)

    await daiPriceFeed.setLatestAnswer(toChainlinkPrice(1))
    await vault.setTokenConfig(...getDaiConfig(dai, daiPriceFeed))

    await btcPriceFeed.setLatestAnswer(toChainlinkPrice(60000))
    await vault.setTokenConfig(...getBtcConfig(btc, btcPriceFeed))

    await bnbPriceFeed.setLatestAnswer(toChainlinkPrice(300))
    await vault.setTokenConfig(...getBnbConfig(bnb, bnbPriceFeed))

    await gsp.setInPrivateTransferMode(true)
    await gsp.setMinter(gspManager.address, true)
    await gspManager.setInPrivateMode(true)

    gsx = await deployContract("GSX", []);
    esGsx = await deployContract("EsGSX", []);


    // GSP
    feeGspTracker = await deployContract("RewardTracker", ["Fee GSP", "fGSP"])
    feeGspDistributor = await deployContract("RewardDistributor", [eth.address, feeGspTracker.address])
    await feeGspTracker.initialize([gsp.address], feeGspDistributor.address)
    await feeGspDistributor.updateLastDistributionTime()

    stakedGspTracker = await deployContract("RewardTracker", ["Fee + Staked GSP", "fsGSP"])
    stakedGspDistributor = await deployContract("RewardDistributor", [esGsx.address, stakedGspTracker.address])
    await stakedGspTracker.initialize([feeGspTracker.address], stakedGspDistributor.address)
    await stakedGspDistributor.updateLastDistributionTime()


    gspVester = await deployContract("Vester", [
      "Vested GSP", // _name
      "vGSP", // _symbol
      vestingDuration, // _vestingDuration
      esGsx.address, // _esToken
      stakedGspTracker.address, // _pairToken
      gsx.address, // _claimableToken
      stakedGspTracker.address, // _rewardTracker
    ])


    await feeGspTracker.setInPrivateTransferMode(true)
    await feeGspTracker.setInPrivateStakingMode(true)
    await stakedGspTracker.setInPrivateTransferMode(true)
    await stakedGspTracker.setInPrivateStakingMode(true)

    await esGsx.setInPrivateTransferMode(true)


    rewardRouter = await deployContract("RewardRouterV2", [])
    await rewardRouter.initialize(
      bnb.address,
      gsx.address,
      esGsx.address,
      gsp.address,
      feeGspTracker.address,
      stakedGspTracker.address,
      gspManager.address,
      gspVester.address
    )

    // allow stakedGspTracker to stake feeGspTracker
    await feeGspTracker.setHandler(stakedGspTracker.address, true)
    // allow feeGspTracker to stake gsp
    await gsp.setHandler(feeGspTracker.address, true)

    // mint esGsx for distributors
    await esGsx.setMinter(wallet.address, true)
    await esGsx.mint(stakedGspDistributor.address, expandDecimals(50000, 18))
    await stakedGspDistributor.setTokensPerInterval("20667989410000000") // 0.02066798941 esGsx per second


    await esGsx.setHandler(tokenManager.address, true)

    await esGsx.setHandler(rewardRouter.address, true)
    await esGsx.setHandler(stakedGspDistributor.address, true)
    await esGsx.setHandler(stakedGspTracker.address, true)
    await esGsx.setHandler(gspVester.address, true)

    await gspManager.setHandler(rewardRouter.address, true)
    await feeGspTracker.setHandler(rewardRouter.address, true)
    await stakedGspTracker.setHandler(rewardRouter.address, true)

    await esGsx.setMinter(gspVester.address, true)

    await gspVester.setHandler(rewardRouter.address, true)

    await stakedGspTracker.setHandler(gspVester.address, true)

    await gspManager.setGov(timelock.address)
    await feeGspTracker.setGov(timelock.address)
    await stakedGspTracker.setGov(timelock.address)
    await stakedGspDistributor.setGov(timelock.address)
    await esGsx.setGov(timelock.address)
    await gspVester.setGov(timelock.address)

  })

  it("inits", async () => {
    expect(await rewardRouter.isInitialized()).eq(true)

    expect(await rewardRouter.weth()).eq(bnb.address)
    expect(await rewardRouter.gsx()).eq(gsx.address)
    expect(await rewardRouter.esGsx()).eq(esGsx.address)

    expect(await rewardRouter.gsp()).eq(gsp.address)


    expect(await rewardRouter.feeGspTracker()).eq(feeGspTracker.address)
    expect(await rewardRouter.stakedGspTracker()).eq(stakedGspTracker.address)

    expect(await rewardRouter.gspManager()).eq(gspManager.address)

    expect(await rewardRouter.gspVester()).eq(gspVester.address)

    await expect(rewardRouter.initialize(
      bnb.address,
      gsx.address,
      esGsx.address,
      gsp.address,
      feeGspTracker.address,
      stakedGspTracker.address,
      gspManager.address,
      gspVester.address,
    )).to.be.revertedWith("already initialized")
  })


  it("mintAndStakeGsp, unstakeAndRedeemGsp", async () => {
    await eth.mint(feeGspDistributor.address, expandDecimals(100, 18))
    await feeGspDistributor.setTokensPerInterval("41335970000000") // 0.00004133597 ETH per second

    await bnb.mint(user1.address, expandDecimals(1, 18))
    await bnb.connect(user1).approve(gspManager.address, expandDecimals(1, 18))
    const tx0 = await rewardRouter.connect(user1).mintAndStakeGsp(
      bnb.address,
      expandDecimals(1, 18),
      expandDecimals(299, 18),
      expandDecimals(299, 18)
    )
    await reportGasUsed(provider, tx0, "mintAndStakeGsp gas used")

    expect(await feeGspTracker.stakedAmounts(user1.address)).eq(expandDecimals(2991, 17))
    expect(await feeGspTracker.depositBalances(user1.address, gsp.address)).eq(expandDecimals(2991, 17))

    expect(await stakedGspTracker.stakedAmounts(user1.address)).eq(expandDecimals(2991, 17))
    expect(await stakedGspTracker.depositBalances(user1.address, feeGspTracker.address)).eq(expandDecimals(2991, 17))

    await bnb.mint(user1.address, expandDecimals(2, 18))
    await bnb.connect(user1).approve(gspManager.address, expandDecimals(2, 18))
    await rewardRouter.connect(user1).mintAndStakeGsp(
      bnb.address,
      expandDecimals(2, 18),
      expandDecimals(299, 18),
      expandDecimals(299, 18)
    )

    await increaseTime(provider, 24 * 60 * 60 + 1)
    await mineBlock(provider)

    expect(await feeGspTracker.claimable(user1.address)).gt("3560000000000000000") // 3.56, 100 / 28 => ~3.57
    expect(await feeGspTracker.claimable(user1.address)).lt("3580000000000000000") // 3.58

    expect(await stakedGspTracker.claimable(user1.address)).gt(expandDecimals(1785, 18)) // 50000 / 28 => ~1785
    expect(await stakedGspTracker.claimable(user1.address)).lt(expandDecimals(1786, 18))

    await bnb.mint(user2.address, expandDecimals(1, 18))
    await bnb.connect(user2).approve(gspManager.address, expandDecimals(1, 18))
    await rewardRouter.connect(user2).mintAndStakeGsp(
      bnb.address,
      expandDecimals(1, 18),
      expandDecimals(299, 18),
      expandDecimals(299, 18)
    )

    await expect(rewardRouter.connect(user2).unstakeAndRedeemGsp(
      bnb.address,
      expandDecimals(299, 18),
      "990000000000000000", // 0.99
      user2.address
    )).to.be.revertedWith("GspManager: cooldown duration not yet passed")

    expect(await feeGspTracker.stakedAmounts(user1.address)).eq("897300000000000000000") // 897.3
    expect(await stakedGspTracker.stakedAmounts(user1.address)).eq("897300000000000000000")
    expect(await bnb.balanceOf(user1.address)).eq(0)

    const tx1 = await rewardRouter.connect(user1).unstakeAndRedeemGsp(
      bnb.address,
      expandDecimals(299, 18),
      "990000000000000000", // 0.99
      user1.address
    )
    await reportGasUsed(provider, tx1, "unstakeAndRedeemGsp gas used")

    expect(await feeGspTracker.stakedAmounts(user1.address)).eq("598300000000000000000") // 598.3
    expect(await stakedGspTracker.stakedAmounts(user1.address)).eq("598300000000000000000")
    expect(await bnb.balanceOf(user1.address)).eq("993676666666666666") // ~0.99

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    expect(await feeGspTracker.claimable(user1.address)).gt("5940000000000000000") // 5.94, 3.57 + 100 / 28 / 3 * 2 => ~5.95
    expect(await feeGspTracker.claimable(user1.address)).lt("5960000000000000000")
    expect(await feeGspTracker.claimable(user2.address)).gt("1180000000000000000") // 1.18, 100 / 28 / 3 => ~1.19
    expect(await feeGspTracker.claimable(user2.address)).lt("1200000000000000000")

    expect(await stakedGspTracker.claimable(user1.address)).gt(expandDecimals(1785 + 1190, 18))
    expect(await stakedGspTracker.claimable(user1.address)).lt(expandDecimals(1786 + 1191, 18))
    expect(await stakedGspTracker.claimable(user2.address)).gt(expandDecimals(595, 18))
    expect(await stakedGspTracker.claimable(user2.address)).lt(expandDecimals(596, 18))

    expect(await esGsx.balanceOf(user1.address)).eq(0)
    await rewardRouter.connect(user1).claimEsGsx()
    expect(await esGsx.balanceOf(user1.address)).gt(expandDecimals(1785 + 1190, 18))
    expect(await esGsx.balanceOf(user1.address)).lt(expandDecimals(1786 + 1191, 18))

    expect(await eth.balanceOf(user1.address)).eq(0)
    await rewardRouter.connect(user1).claimFees()
    expect(await eth.balanceOf(user1.address)).gt("5940000000000000000")
    expect(await eth.balanceOf(user1.address)).lt("5960000000000000000")

    expect(await esGsx.balanceOf(user2.address)).eq(0)
    await rewardRouter.connect(user2).claimEsGsx()
    expect(await esGsx.balanceOf(user2.address)).gt(expandDecimals(595, 18))
    expect(await esGsx.balanceOf(user2.address)).lt(expandDecimals(596, 18))

    expect(await eth.balanceOf(user2.address)).eq(0)
    await rewardRouter.connect(user2).claimFees()
    expect(await eth.balanceOf(user2.address)).gt("1180000000000000000")
    expect(await eth.balanceOf(user2.address)).lt("1200000000000000000")

  })

  it("mintAndStakeGspETH, unstakeAndRedeemGspETH", async () => {
    const receiver0 = newWallet()
    await expect(rewardRouter.connect(user0).mintAndStakeGspETH(expandDecimals(300, 18), expandDecimals(300, 18), { value: 0 }))
      .to.be.revertedWith("invalid msg.value")

    await expect(rewardRouter.connect(user0).mintAndStakeGspETH(expandDecimals(300, 18), expandDecimals(300, 18), { value: expandDecimals(1, 18) }))
      .to.be.revertedWith("GspManager: insufficient USDG output")

    await expect(rewardRouter.connect(user0).mintAndStakeGspETH(expandDecimals(299, 18), expandDecimals(300, 18), { value: expandDecimals(1, 18) }))
      .to.be.revertedWith("GspManager: insufficient GSP output")

    expect(await bnb.balanceOf(user0.address)).eq(0)
    expect(await bnb.balanceOf(vault.address)).eq(0)
    expect(await bnb.totalSupply()).eq(0)
    expect(await provider.getBalance(bnb.address)).eq(0)
    expect(await stakedGspTracker.balanceOf(user0.address)).eq(0)

    await rewardRouter.connect(user0).mintAndStakeGspETH(expandDecimals(299, 18), expandDecimals(299, 18), { value: expandDecimals(1, 18) })

    expect(await bnb.balanceOf(user0.address)).eq(0)
    expect(await bnb.balanceOf(vault.address)).eq(expandDecimals(1, 18))
    expect(await provider.getBalance(bnb.address)).eq(expandDecimals(1, 18))
    expect(await bnb.totalSupply()).eq(expandDecimals(1, 18))
    expect(await stakedGspTracker.balanceOf(user0.address)).eq("299100000000000000000") // 299.1

    await expect(rewardRouter.connect(user0).unstakeAndRedeemGspETH(expandDecimals(300, 18), expandDecimals(1, 18), receiver0.address))
      .to.be.revertedWith("RewardTracker: _amount exceeds stakedAmount")

    await expect(rewardRouter.connect(user0).unstakeAndRedeemGspETH("299100000000000000000", expandDecimals(1, 18), receiver0.address))
      .to.be.revertedWith("GspManager: cooldown duration not yet passed")

    await increaseTime(provider, 24 * 60 * 60 + 10)

    await expect(rewardRouter.connect(user0).unstakeAndRedeemGspETH("299100000000000000000", expandDecimals(1, 18), receiver0.address))
      .to.be.revertedWith("GspManager: insufficient output")

    await rewardRouter.connect(user0).unstakeAndRedeemGspETH("299100000000000000000", "990000000000000000", receiver0.address)
    expect(await provider.getBalance(receiver0.address)).eq("994009000000000000") // 0.994009
    expect(await bnb.balanceOf(vault.address)).eq("5991000000000000") // 0.005991
    expect(await provider.getBalance(bnb.address)).eq("5991000000000000")
    expect(await bnb.totalSupply()).eq("5991000000000000")
  })

  it("handleRewards", async () => {
    const timelockV2 = wallet

    // use new rewardRouter, use eth for weth
    const rewardRouterV2 = await deployContract("RewardRouterV2", [])
    await rewardRouterV2.initialize(
      eth.address,
      gsx.address,
      esGsx.address,
      gsp.address,
      feeGspTracker.address,
      stakedGspTracker.address,
      gspManager.address,
      gspVester.address
    )


    await timelock.signalSetGov(gspManager.address, timelockV2.address)
    await timelock.signalSetGov(feeGspTracker.address, timelockV2.address)
    await timelock.signalSetGov(stakedGspTracker.address, timelockV2.address)
    await timelock.signalSetGov(stakedGspDistributor.address, timelockV2.address)
    await timelock.signalSetGov(esGsx.address, timelockV2.address)
    await timelock.signalSetGov(gspVester.address, timelockV2.address)

    await increaseTime(provider, 20)
    await mineBlock(provider)

    await timelock.setGov(gspManager.address, timelockV2.address)
    await timelock.setGov(feeGspTracker.address, timelockV2.address)
    await timelock.setGov(stakedGspTracker.address, timelockV2.address)
    await timelock.setGov(stakedGspDistributor.address, timelockV2.address)
    await timelock.setGov(esGsx.address, timelockV2.address)
    await timelock.setGov(gspVester.address, timelockV2.address)

    await esGsx.setHandler(rewardRouterV2.address, true)
    await esGsx.setHandler(stakedGspDistributor.address, true)
    await esGsx.setHandler(stakedGspTracker.address, true)
    await esGsx.setHandler(gspVester.address, true)

    await gspManager.setHandler(rewardRouterV2.address, true)
    await feeGspTracker.setHandler(rewardRouterV2.address, true)
    await stakedGspTracker.setHandler(rewardRouterV2.address, true)

    await esGsx.setHandler(rewardRouterV2.address, true)
    await esGsx.setMinter(gspVester.address, true)

    await gspVester.setHandler(rewardRouterV2.address, true)

    await stakedGspTracker.setHandler(gspVester.address, true)

    await eth.deposit({ value: expandDecimals(10, 18) })

    await gsx.setMinter(wallet.address, true)
    await gsx.mint(gspVester.address, expandDecimals(10000, 18))

    await eth.mint(feeGspDistributor.address, expandDecimals(50, 18))
    await feeGspDistributor.setTokensPerInterval("41335970000000") // 0.00004133597 ETH per second

    await bnb.mint(user1.address, expandDecimals(1, 18))
    await bnb.connect(user1).approve(gspManager.address, expandDecimals(1, 18))
    await rewardRouterV2.connect(user1).mintAndStakeGsp(
      bnb.address,
      expandDecimals(1, 18),
      expandDecimals(299, 18),
      expandDecimals(299, 18)
    )

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    expect(await gsx.balanceOf(user1.address)).eq(0)
    expect(await esGsx.balanceOf(user1.address)).eq(0)
    expect(await gsp.balanceOf(user1.address)).eq(0)
    expect(await eth.balanceOf(user1.address)).eq(0)


    await rewardRouterV2.connect(user1).handleRewards(
      true, // _shouldClaimGsx
      true, // _shouldClaimEsGsx
      true, // _shouldClaimWeth
      false // _shouldConvertWethToEth
    )

    expect(await gsx.balanceOf(user1.address)).eq(0)
    expect(await esGsx.balanceOf(user1.address)).gt(expandDecimals(1500, 18))
    expect(await esGsx.balanceOf(user1.address)).lt(expandDecimals(2000, 18))
    expect(await gsp.balanceOf(user1.address)).eq(0)
    expect(await eth.balanceOf(user1.address)).gt(expandDecimals(3, 18))
    expect(await eth.balanceOf(user1.address)).lt(expandDecimals(4, 18))

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    const ethBalance0 = await provider.getBalance(user1.address)

    await rewardRouterV2.connect(user1).handleRewards(
      false, // _shouldClaimGsx
      false, // _shouldClaimEsGsx
      true, // _shouldClaimWeth
      true // _shouldConvertWethToEth
    )
    const ethBalance1 = await provider.getBalance(user1.address)
    expect(await ethBalance1.sub(ethBalance0)).gt(expandDecimals(3, 18))
    expect(await ethBalance1.sub(ethBalance0)).lt(expandDecimals(4, 18))
    expect(await eth.balanceOf(user1.address)).gt(expandDecimals(3, 18))
    expect(await eth.balanceOf(user1.address)).lt(expandDecimals(4, 18))


    await rewardRouterV2.connect(user1).handleRewards(
      false, // _shouldClaimGsx
      true, // _shouldClaimEsGsx
      false, // _shouldClaimWeth
      false // _shouldConvertWethToEth
    )

    expect(await esGsx.balanceOf(user1.address)).gt(expandDecimals(3571, 18))
    expect(await esGsx.balanceOf(user1.address)).lt(expandDecimals(3572, 18))

    const esGsxB1 = await esGsx.balanceOf(user1.address)
    await gspVester.connect(user1).deposit(expandDecimals(365 * 2, 18))
    const esGsxB2 = await esGsx.balanceOf(user1.address)
    
    console.log(esGsxB1.toString())
    console.log(esGsxB2.toString())
    expect(await ethBalance1.sub(ethBalance0)).gt(expandDecimals(3, 18))
    expect(await ethBalance1.sub(ethBalance0)).lt(expandDecimals(4, 18))
    expect(await gsx.balanceOf(user1.address)).eq(0)
    expect(await esGsx.balanceOf(user1.address)).gt(expandDecimals(2841, 18))
    expect(await esGsx.balanceOf(user1.address)).lt(expandDecimals(2842, 18))
    expect(await gsp.balanceOf(user1.address)).eq(0)
    expect(await eth.balanceOf(user1.address)).gt(expandDecimals(3, 18))
    expect(await eth.balanceOf(user1.address)).lt(expandDecimals(4, 18))


    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    await rewardRouterV2.connect(user1).handleRewards(
      true, // _shouldClaimGsx
      false, // _shouldClaimEsGsx
      false, // _shouldClaimWeth
      false // _shouldConvertWethToEth
    )

    expect(await ethBalance1.sub(ethBalance0)).gt(expandDecimals(3, 18))
    expect(await ethBalance1.sub(ethBalance0)).lt(expandDecimals(4, 18))
    expect(await gsx.balanceOf(user1.address)).gt(expandDecimals(2, 18))
    expect(await gsx.balanceOf(user1.address)).lt(expandDecimals(3, 18))
    expect(await esGsx.balanceOf(user1.address)).gt(expandDecimals(2841, 18))
    expect(await esGsx.balanceOf(user1.address)).lt(expandDecimals(2842, 18))
    expect(await gsp.balanceOf(user1.address)).eq(0)
    expect(await eth.balanceOf(user1.address)).gt(expandDecimals(3, 18))
    expect(await eth.balanceOf(user1.address)).lt(expandDecimals(4, 18))

  })


  it("FeeGsp", async () => {
    await eth.mint(feeGspDistributor.address, expandDecimals(100, 18))
    await feeGspDistributor.setTokensPerInterval("41335970000000") // 0.00004133597 ETH per second

    await bnb.mint(user1.address, expandDecimals(1, 18))
    await bnb.connect(user1).approve(gspManager.address, expandDecimals(1, 18))
    await rewardRouter.connect(user1).mintAndStakeGsp(
      bnb.address,
      expandDecimals(1, 18),
      expandDecimals(299, 18),
      expandDecimals(299, 18)
    )

    expect(await feeGspTracker.stakedAmounts(user1.address)).eq(expandDecimals(2991, 17))
    expect(await feeGspTracker.depositBalances(user1.address, gsp.address)).eq(expandDecimals(2991, 17))

    expect(await stakedGspTracker.stakedAmounts(user1.address)).eq(expandDecimals(2991, 17))
    expect(await stakedGspTracker.depositBalances(user1.address, feeGspTracker.address)).eq(expandDecimals(2991, 17))

    const gspBalance = await deployContract("GspBalance", [gspManager.address, stakedGspTracker.address])

    await expect(gspBalance.connect(user2).transferFrom(user1.address, user3.address, expandDecimals(2991, 17)))
      .to.be.revertedWith("GspBalance: transfer amount exceeds allowance")

    await gspBalance.connect(user1).approve(user2.address, expandDecimals(2991, 17))

    await expect(gspBalance.connect(user2).transferFrom(user1.address, user3.address, expandDecimals(2991, 17)))
      .to.be.revertedWith("GspBalance: cooldown duration not yet passed")

    await increaseTime(provider, 24 * 60 * 60 + 10)
    await mineBlock(provider)

    await expect(gspBalance.connect(user2).transferFrom(user1.address, user3.address, expandDecimals(2991, 17)))
      .to.be.revertedWith("RewardTracker: transfer amount exceeds allowance")

    await timelock.signalSetHandler(stakedGspTracker.address, gspBalance.address, true)
    await increaseTime(provider, 20)
    await mineBlock(provider)
    await timelock.setHandler(stakedGspTracker.address, gspBalance.address, true)

    expect(await feeGspTracker.stakedAmounts(user1.address)).eq(expandDecimals(2991, 17))
    expect(await feeGspTracker.depositBalances(user1.address, gsp.address)).eq(expandDecimals(2991, 17))

    expect(await stakedGspTracker.stakedAmounts(user1.address)).eq(expandDecimals(2991, 17))
    expect(await stakedGspTracker.depositBalances(user1.address, feeGspTracker.address)).eq(expandDecimals(2991, 17))
    expect(await stakedGspTracker.balanceOf(user1.address)).eq(expandDecimals(2991, 17))

    expect(await feeGspTracker.stakedAmounts(user3.address)).eq(0)
    expect(await feeGspTracker.depositBalances(user3.address, gsp.address)).eq(0)

    expect(await stakedGspTracker.stakedAmounts(user3.address)).eq(0)
    expect(await stakedGspTracker.depositBalances(user3.address, feeGspTracker.address)).eq(0)
    expect(await stakedGspTracker.balanceOf(user3.address)).eq(0)

    await gspBalance.connect(user2).transferFrom(user1.address, user3.address, expandDecimals(2991, 17))

    expect(await feeGspTracker.stakedAmounts(user1.address)).eq(expandDecimals(2991, 17))
    expect(await feeGspTracker.depositBalances(user1.address, gsp.address)).eq(expandDecimals(2991, 17))

    expect(await stakedGspTracker.stakedAmounts(user1.address)).eq(expandDecimals(2991, 17))
    expect(await stakedGspTracker.depositBalances(user1.address, feeGspTracker.address)).eq(expandDecimals(2991, 17))
    expect(await stakedGspTracker.balanceOf(user1.address)).eq(0)

    expect(await feeGspTracker.stakedAmounts(user3.address)).eq(0)
    expect(await feeGspTracker.depositBalances(user3.address, gsp.address)).eq(0)

    expect(await stakedGspTracker.stakedAmounts(user3.address)).eq(0)
    expect(await stakedGspTracker.depositBalances(user3.address, feeGspTracker.address)).eq(0)
    expect(await stakedGspTracker.balanceOf(user3.address)).eq(expandDecimals(2991, 17))

    await expect(rewardRouter.connect(user1).unstakeAndRedeemGsp(
      bnb.address,
      expandDecimals(2991, 17),
      "0",
      user1.address
    )).to.be.revertedWith("RewardTracker: burn amount exceeds balance")

    await gspBalance.connect(user3).approve(user2.address, expandDecimals(3000, 17))

    await expect(gspBalance.connect(user2).transferFrom(user3.address, user1.address, expandDecimals(2992, 17)))
      .to.be.revertedWith("RewardTracker: transfer amount exceeds balance")

    await gspBalance.connect(user2).transferFrom(user3.address, user1.address, expandDecimals(2991, 17))

    expect(await bnb.balanceOf(user1.address)).eq(0)

    await rewardRouter.connect(user1).unstakeAndRedeemGsp(
      bnb.address,
      expandDecimals(2991, 17),
      "0",
      user1.address
    )

    expect(await bnb.balanceOf(user1.address)).eq("994009000000000000")
  })
})

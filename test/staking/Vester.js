const { expect, use } = require("chai")
const { solidity } = require("ethereum-waffle")
const { deployContract } = require("../shared/fixtures")
const { expandDecimals, getBlockTime, increaseTime, mineBlock, reportGasUsed, print } = require("../shared/utilities")
const { toChainlinkPrice } = require("../shared/chainlink")
const { toUsd, toNormalizedPrice } = require("../shared/units")

use(solidity)

const secondsPerYear = 365 * 24 * 60 * 60
const { AddressZero } = ethers.constants

describe("Vester", function () {
  const provider = waffle.provider
  const [wallet, user0, user1, user2, user3, user4] = provider.getWallets()
  let gsx
  let esGsx
  let eth

  beforeEach(async () => {
    gsx = await deployContract("GSX", []);
    esGsx = await deployContract("EsGSX", []);
    eth = await deployContract("Token", [])

    await esGsx.setMinter(wallet.address, true)
    await gsx.setMinter(wallet.address, true)
  })

  it("inits", async () => {
    const vester = await deployContract("Vester", [
      "Vested GSX",
      "veGSX",
      secondsPerYear,
      esGsx.address,
      AddressZero,
      gsx.address,
      AddressZero
    ])

    expect(await vester.name()).eq("Vested GSX")
    expect(await vester.symbol()).eq("veGSX")
    expect(await vester.vestingDuration()).eq(secondsPerYear)
    expect(await vester.esToken()).eq(esGsx.address)
    expect(await vester.pairToken()).eq(AddressZero)
    expect(await vester.claimableToken()).eq(gsx.address)
    expect(await vester.rewardTracker()).eq(AddressZero)
    expect(await vester.hasPairToken()).eq(false)
    expect(await vester.hasRewardTracker()).eq(false)
    expect(await vester.hasMaxVestableAmount()).eq(false)
  })

  it("setTransferredAverageStakedAmounts", async () => {
    const vester = await deployContract("Vester", [
      "Vested GSX",
      "veGSX",
      secondsPerYear,
      esGsx.address,
      AddressZero,
      gsx.address,
      AddressZero
    ])

    await expect(vester.setTransferredAverageStakedAmounts(user0.address, 200))
      .to.be.revertedWith("Vester: forbidden")

    await vester.setHandler(wallet.address, true)

    expect(await vester.transferredAverageStakedAmounts(user0.address)).eq(0)
    await vester.setTransferredAverageStakedAmounts(user0.address, 200)
    expect(await vester.transferredAverageStakedAmounts(user0.address)).eq(200)
  })

  it("setTransferredCumulativeRewards", async () => {
    const vester = await deployContract("Vester", [
      "Vested GSX",
      "veGSX",
      secondsPerYear,
      esGsx.address,
      AddressZero,
      gsx.address,
      AddressZero
    ])

    await expect(vester.setTransferredCumulativeRewards(user0.address, 200))
      .to.be.revertedWith("Vester: forbidden")

    await vester.setHandler(wallet.address, true)

    expect(await vester.transferredCumulativeRewards(user0.address)).eq(0)
    await vester.setTransferredCumulativeRewards(user0.address, 200)
    expect(await vester.transferredCumulativeRewards(user0.address)).eq(200)
  })

  it("setCumulativeRewardDeductions", async () => {
    const vester = await deployContract("Vester", [
      "Vested GSX",
      "veGSX",
      secondsPerYear,
      esGsx.address,
      AddressZero,
      gsx.address,
      AddressZero
    ])

    await expect(vester.setCumulativeRewardDeductions(user0.address, 200))
      .to.be.revertedWith("Vester: forbidden")

    await vester.setHandler(wallet.address, true)

    expect(await vester.cumulativeRewardDeductions(user0.address)).eq(0)
    await vester.setCumulativeRewardDeductions(user0.address, 200)
    expect(await vester.cumulativeRewardDeductions(user0.address)).eq(200)
  })

  it("setBonusRewards", async () => {
    const vester = await deployContract("Vester", [
      "Vested GSX",
      "veGSX",
      secondsPerYear,
      esGsx.address,
      AddressZero,
      gsx.address,
      AddressZero
    ])

    await expect(vester.setBonusRewards(user0.address, 200))
      .to.be.revertedWith("Vester: forbidden")

    await vester.setHandler(wallet.address, true)

    expect(await vester.bonusRewards(user0.address)).eq(0)
    await vester.setBonusRewards(user0.address, 200)
    expect(await vester.bonusRewards(user0.address)).eq(200)
  })

  it("deposit, claim, withdraw", async () => {
    const vester = await deployContract("Vester", [
      "Vested GSX",
      "veGSX",
      secondsPerYear,
      esGsx.address,
      AddressZero,
      gsx.address,
      AddressZero
    ])
    await esGsx.setMinter(vester.address, true)

    await expect(vester.connect(user0).deposit(0))
      .to.be.revertedWith("Vester: invalid _amount")

    await expect(vester.connect(user0).deposit(expandDecimals(1000, 18)))
      .to.be.revertedWith("BaseToken: transfer amount exceeds allowance")

    await esGsx.connect(user0).approve(vester.address, expandDecimals(1000, 18))

    await expect(vester.connect(user0).deposit(expandDecimals(1000, 18)))
      .to.be.revertedWith("BaseToken: transfer amount exceeds balance")

    expect(await vester.balanceOf(user0.address)).eq(0)
    expect(await vester.getTotalVested(user0.address)).eq(0)
    expect(await vester.cumulativeClaimAmounts(user0.address)).eq(0)
    expect(await vester.claimedAmounts(user0.address)).eq(0)
    expect(await vester.claimable(user0.address)).eq(0)
    expect(await vester.pairAmounts(user0.address)).eq(0)
    expect(await vester.lastVestingTimes(user0.address)).eq(0)

    await esGsx.mint(user0.address, expandDecimals(1000, 18))
    await vester.connect(user0).deposit(expandDecimals(1000, 18))

    let blockTime = await getBlockTime(provider)

    expect(await vester.balanceOf(user0.address)).eq(expandDecimals(1000, 18))
    expect(await vester.getTotalVested(user0.address)).eq(expandDecimals(1000, 18))
    expect(await vester.cumulativeClaimAmounts(user0.address)).eq(0)
    expect(await vester.claimedAmounts(user0.address)).eq(0)
    expect(await vester.claimable(user0.address)).eq(0)
    expect(await vester.pairAmounts(user0.address)).eq(0)
    expect(await vester.lastVestingTimes(user0.address)).eq(blockTime)

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    expect(await esGsx.balanceOf(user0.address)).eq(0)
    expect(await gsx.balanceOf(user0.address)).eq(0)
    expect(await vester.balanceOf(user0.address)).eq(expandDecimals(1000, 18))
    expect(await vester.getTotalVested(user0.address)).eq(expandDecimals(1000, 18))
    expect(await vester.cumulativeClaimAmounts(user0.address)).eq(0)
    expect(await vester.claimedAmounts(user0.address)).eq(0)
    expect(await vester.claimable(user0.address)).gt("2730000000000000000") // 1000 / 365 => ~2.739
    expect(await vester.claimable(user0.address)).lt("2750000000000000000")
    expect(await vester.pairAmounts(user0.address)).eq(0)
    expect(await vester.lastVestingTimes(user0.address)).eq(blockTime)

    await expect(vester.connect(user0).claim())
      .to.be.revertedWith("BaseToken: transfer amount exceeds balance")

    await gsx.mint(vester.address, expandDecimals(2000, 18))

    await vester.connect(user0).claim()
    blockTime = await getBlockTime(provider)

    expect(await esGsx.balanceOf(user0.address)).eq(0)
    expect(await gsx.balanceOf(user0.address)).gt("2730000000000000000")
    expect(await gsx.balanceOf(user0.address)).lt("2750000000000000000")

    let gsxAmount = await gsx.balanceOf(user0.address)
    expect(await vester.balanceOf(user0.address)).eq(expandDecimals(1000, 18).sub(gsxAmount))

    expect(await vester.getTotalVested(user0.address)).eq(expandDecimals(1000, 18))
    expect(await vester.cumulativeClaimAmounts(user0.address)).eq(gsxAmount)
    expect(await vester.claimedAmounts(user0.address)).eq(gsxAmount)
    expect(await vester.claimable(user0.address)).eq(0)
    expect(await vester.pairAmounts(user0.address)).eq(0)
    expect(await vester.lastVestingTimes(user0.address)).eq(blockTime)

    await increaseTime(provider, 48 * 60 * 60)
    await mineBlock(provider)

    expect(await vester.cumulativeClaimAmounts(user0.address)).eq(gsxAmount)
    expect(await vester.claimedAmounts(user0.address)).eq(gsxAmount)
    expect(await vester.claimable(user0.address)).gt("5478000000000000000") // 1000 / 365 * 2 => ~5.479
    expect(await vester.claimable(user0.address)).lt("5480000000000000000")

    await increaseTime(provider, (parseInt(365 / 2 - 1)) * 24 * 60 * 60)
    await mineBlock(provider)

    expect(await vester.cumulativeClaimAmounts(user0.address)).eq(gsxAmount)
    expect(await vester.claimedAmounts(user0.address)).eq(gsxAmount)
    expect(await vester.claimable(user0.address)).gt(expandDecimals(500, 18)) // 1000 / 2 => 500
    expect(await vester.claimable(user0.address)).lt(expandDecimals(502, 18))

    await vester.connect(user0).claim()
    blockTime = await getBlockTime(provider)

    expect(await esGsx.balanceOf(user0.address)).eq(0)
    expect(await gsx.balanceOf(user0.address)).gt(expandDecimals(503, 18))
    expect(await gsx.balanceOf(user0.address)).lt(expandDecimals(505, 18))

    gsxAmount = await gsx.balanceOf(user0.address)
    expect(await vester.balanceOf(user0.address)).eq(expandDecimals(1000, 18).sub(gsxAmount))

    expect(await vester.getTotalVested(user0.address)).eq(expandDecimals(1000, 18))
    expect(await vester.cumulativeClaimAmounts(user0.address)).eq(gsxAmount)
    expect(await vester.claimedAmounts(user0.address)).eq(gsxAmount)
    expect(await vester.claimable(user0.address)).eq(0)
    expect(await vester.pairAmounts(user0.address)).eq(0)
    expect(await vester.lastVestingTimes(user0.address)).eq(blockTime)

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    // vesting rate should be the same even after claiming
    expect(await vester.claimable(user0.address)).gt("2730000000000000000") // 1000 / 365 => ~2.739
    expect(await vester.claimable(user0.address)).lt("2750000000000000000")

    await esGsx.mint(user0.address, expandDecimals(500, 18))
    await esGsx.connect(user0).approve(vester.address, expandDecimals(500, 18))
    await vester.connect(user0).deposit(expandDecimals(500, 18))

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    expect(await vester.claimable(user0.address)).gt("6840000000000000000") // 1000 / 365 + 1500 / 365 => 6.849
    expect(await vester.claimable(user0.address)).lt("6860000000000000000")

    expect(await esGsx.balanceOf(user0.address)).eq(0)
    expect(await gsx.balanceOf(user0.address)).eq(gsxAmount)

    await vester.connect(user0).withdraw()

    expect(await esGsx.balanceOf(user0.address)).gt(expandDecimals(989, 18))
    expect(await esGsx.balanceOf(user0.address)).lt(expandDecimals(990, 18))
    expect(await gsx.balanceOf(user0.address)).gt(expandDecimals(510, 18))
    expect(await gsx.balanceOf(user0.address)).lt(expandDecimals(512, 18))

    expect(await vester.balanceOf(user0.address)).eq(0)
    expect(await vester.getTotalVested(user0.address)).eq(0)
    expect(await vester.cumulativeClaimAmounts(user0.address)).eq(0)
    expect(await vester.claimedAmounts(user0.address)).eq(0)
    expect(await vester.claimable(user0.address)).eq(0)
    expect(await vester.pairAmounts(user0.address)).eq(0)
    expect(await vester.lastVestingTimes(user0.address)).eq(0)

    await esGsx.connect(user0).approve(vester.address, expandDecimals(1000, 18))
    await esGsx.mint(user0.address, expandDecimals(1000, 18))
    await vester.connect(user0).deposit(expandDecimals(1000, 18))
    blockTime = await getBlockTime(provider)

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    expect(await vester.balanceOf(user0.address)).eq(expandDecimals(1000, 18))
    expect(await vester.getTotalVested(user0.address)).eq(expandDecimals(1000, 18))
    expect(await vester.cumulativeClaimAmounts(user0.address)).eq(0)
    expect(await vester.claimedAmounts(user0.address)).eq(0)
    expect(await vester.claimable(user0.address)).gt("2730000000000000000") // 1000 / 365 => ~2.739
    expect(await vester.claimable(user0.address)).lt("2750000000000000000")
    expect(await vester.pairAmounts(user0.address)).eq(0)
    expect(await vester.lastVestingTimes(user0.address)).eq(blockTime)

    await vester.connect(user0).claim()
  })

  it("depositForAccount, claimForAccount", async () => {
    const vester = await deployContract("Vester", [
      "Vested GSX",
      "veGSX",
      secondsPerYear,
      esGsx.address,
      AddressZero,
      gsx.address,
      AddressZero
    ])
    await esGsx.setMinter(vester.address, true)
    await vester.setHandler(wallet.address, true)

    await esGsx.connect(user0).approve(vester.address, expandDecimals(1000, 18))

    expect(await vester.balanceOf(user0.address)).eq(0)
    expect(await vester.getTotalVested(user0.address)).eq(0)
    expect(await vester.cumulativeClaimAmounts(user0.address)).eq(0)
    expect(await vester.claimedAmounts(user0.address)).eq(0)
    expect(await vester.claimable(user0.address)).eq(0)
    expect(await vester.pairAmounts(user0.address)).eq(0)
    expect(await vester.lastVestingTimes(user0.address)).eq(0)

    await esGsx.mint(user0.address, expandDecimals(1000, 18))

    await expect(vester.connect(user2).depositForAccount(user0.address, expandDecimals(1000, 18)))
      .to.be.revertedWith("Vester: forbidden")

    await vester.setHandler(user2.address, true)
    await vester.connect(user2).depositForAccount(user0.address, expandDecimals(1000, 18))

    let blockTime = await getBlockTime(provider)

    expect(await vester.balanceOf(user0.address)).eq(expandDecimals(1000, 18))
    expect(await vester.getTotalVested(user0.address)).eq(expandDecimals(1000, 18))
    expect(await vester.cumulativeClaimAmounts(user0.address)).eq(0)
    expect(await vester.claimedAmounts(user0.address)).eq(0)
    expect(await vester.claimable(user0.address)).eq(0)
    expect(await vester.pairAmounts(user0.address)).eq(0)
    expect(await vester.lastVestingTimes(user0.address)).eq(blockTime)

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    expect(await esGsx.balanceOf(user0.address)).eq(0)
    expect(await gsx.balanceOf(user0.address)).eq(0)
    expect(await vester.balanceOf(user0.address)).eq(expandDecimals(1000, 18))
    expect(await vester.getTotalVested(user0.address)).eq(expandDecimals(1000, 18))
    expect(await vester.cumulativeClaimAmounts(user0.address)).eq(0)
    expect(await vester.claimedAmounts(user0.address)).eq(0)
    expect(await vester.claimable(user0.address)).gt("2730000000000000000") // 1000 / 365 => ~2.739
    expect(await vester.claimable(user0.address)).lt("2750000000000000000")
    expect(await vester.pairAmounts(user0.address)).eq(0)
    expect(await vester.lastVestingTimes(user0.address)).eq(blockTime)

    await expect(vester.connect(user0).claim())
      .to.be.revertedWith("BaseToken: transfer amount exceeds balance")

    await gsx.mint(vester.address, expandDecimals(2000, 18))

    await expect(vester.connect(user3).claimForAccount(user0.address, user4.address))
      .to.be.revertedWith("Vester: forbidden")

    await vester.setHandler(user3.address, true)

    await vester.connect(user3).claimForAccount(user0.address, user4.address)
    blockTime = await getBlockTime(provider)

    expect(await esGsx.balanceOf(user4.address)).eq(0)
    expect(await gsx.balanceOf(user4.address)).gt("2730000000000000000")
    expect(await gsx.balanceOf(user4.address)).lt("2750000000000000000")

    expect(await esGsx.balanceOf(user0.address)).eq(0)
    expect(await gsx.balanceOf(user0.address)).eq(0)
    expect(await vester.balanceOf(user0.address)).gt(expandDecimals(996, 18))
    expect(await vester.balanceOf(user0.address)).lt(expandDecimals(998, 18))
    expect(await vester.getTotalVested(user0.address)).eq(expandDecimals(1000, 18))
    expect(await vester.cumulativeClaimAmounts(user0.address)).gt("2730000000000000000")
    expect(await vester.cumulativeClaimAmounts(user0.address)).lt("2750000000000000000")
    expect(await vester.claimedAmounts(user0.address)).gt("2730000000000000000")
    expect(await vester.claimedAmounts(user0.address)).lt("2750000000000000000")
    expect(await vester.claimable(user0.address)).eq(0)
    expect(await vester.pairAmounts(user0.address)).eq(0)
    expect(await vester.lastVestingTimes(user0.address)).eq(blockTime)
  })

  it("handles multiple deposits", async () => {
    const vester = await deployContract("Vester", [
      "Vested GSX",
      "veGSX",
      secondsPerYear,
      esGsx.address,
      AddressZero,
      gsx.address,
      AddressZero
    ])
    await esGsx.setMinter(vester.address, true)
    await vester.setHandler(wallet.address, true)

    await esGsx.connect(user0).approve(vester.address, expandDecimals(1000, 18))

    expect(await vester.balanceOf(user0.address)).eq(0)
    expect(await vester.getTotalVested(user0.address)).eq(0)
    expect(await vester.cumulativeClaimAmounts(user0.address)).eq(0)
    expect(await vester.claimedAmounts(user0.address)).eq(0)
    expect(await vester.claimable(user0.address)).eq(0)
    expect(await vester.pairAmounts(user0.address)).eq(0)
    expect(await vester.lastVestingTimes(user0.address)).eq(0)

    await esGsx.mint(user0.address, expandDecimals(1000, 18))
    await vester.connect(user0).deposit(expandDecimals(1000, 18))

    let blockTime = await getBlockTime(provider)

    expect(await vester.balanceOf(user0.address)).eq(expandDecimals(1000, 18))
    expect(await vester.getTotalVested(user0.address)).eq(expandDecimals(1000, 18))
    expect(await vester.cumulativeClaimAmounts(user0.address)).eq(0)
    expect(await vester.claimedAmounts(user0.address)).eq(0)
    expect(await vester.claimable(user0.address)).eq(0)
    expect(await vester.pairAmounts(user0.address)).eq(0)
    expect(await vester.lastVestingTimes(user0.address)).eq(blockTime)

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    expect(await esGsx.balanceOf(user0.address)).eq(0)
    expect(await gsx.balanceOf(user0.address)).eq(0)
    expect(await vester.balanceOf(user0.address)).eq(expandDecimals(1000, 18))
    expect(await vester.getTotalVested(user0.address)).eq(expandDecimals(1000, 18))
    expect(await vester.cumulativeClaimAmounts(user0.address)).eq(0)
    expect(await vester.claimedAmounts(user0.address)).eq(0)
    expect(await vester.claimable(user0.address)).gt("2730000000000000000") // 1000 / 365 => ~2.739
    expect(await vester.claimable(user0.address)).lt("2750000000000000000")
    expect(await vester.pairAmounts(user0.address)).eq(0)
    expect(await vester.lastVestingTimes(user0.address)).eq(blockTime)

    await expect(vester.connect(user0).claim())
      .to.be.revertedWith("BaseToken: transfer amount exceeds balance")

    await gsx.mint(vester.address, expandDecimals(2000, 18))

    await increaseTime(provider, 24 * 60 * 60)
    await mineBlock(provider)

    expect(await vester.balanceOf(user0.address)).eq(expandDecimals(1000, 18))

    await esGsx.mint(user0.address, expandDecimals(500, 18))
    await esGsx.connect(user0).approve(vester.address, expandDecimals(500, 18))
    await vester.connect(user0).deposit(expandDecimals(500, 18))
    blockTime = await getBlockTime(provider)

    expect(await vester.balanceOf(user0.address)).gt(expandDecimals(1494, 18))
    expect(await vester.balanceOf(user0.address)).lt(expandDecimals(1496, 18))
    expect(await vester.getTotalVested(user0.address)).eq(expandDecimals(1500, 18))
    expect(await vester.cumulativeClaimAmounts(user0.address)).gt("5470000000000000000") // 5.47, 1000 / 365 * 2 => ~5.48
    expect(await vester.cumulativeClaimAmounts(user0.address)).lt("5490000000000000000") // 5.49
    expect(await vester.claimedAmounts(user0.address)).eq(0)
    expect(await vester.claimable(user0.address)).gt("5470000000000000000")
    expect(await vester.claimable(user0.address)).lt("5490000000000000000")
    expect(await vester.pairAmounts(user0.address)).eq(0)
    expect(await vester.lastVestingTimes(user0.address)).eq(blockTime)

    await vester.connect(user0).withdraw()

    expect(await esGsx.balanceOf(user0.address)).gt(expandDecimals(1494, 18))
    expect(await esGsx.balanceOf(user0.address)).lt(expandDecimals(1496, 18))
    expect(await gsx.balanceOf(user0.address)).gt("5470000000000000000")
    expect(await gsx.balanceOf(user0.address)).lt("5490000000000000000")
    expect(await vester.balanceOf(user0.address)).eq(0)
    expect(await vester.getTotalVested(user0.address)).eq(0)
    expect(await vester.cumulativeClaimAmounts(user0.address)).eq(0) // 5.47, 1000 / 365 * 2 => ~5.48
    expect(await vester.claimedAmounts(user0.address)).eq(0)
    expect(await vester.claimable(user0.address)).eq(0)
    expect(await vester.pairAmounts(user0.address)).eq(0)
    expect(await vester.lastVestingTimes(user0.address)).eq(0)
  })
})

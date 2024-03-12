# 质押相关: [质押GSP、FGSP]、[领取esGSX]、[领取GSX]

# 1、质押GSP、FGSP 在 添加流动性的同时已经质押
## 相关合约 feeGspTracker、feeGspDistributor
   - staked: GSP  --------  mintAndStakeGsp, 与fGSP同时质押
   - return: fgsp 
   - Reward: WETH  (每秒多少)

# 2、领取esGSX
## 相关合约: stakedGspTracker、stakedGspDistributor
   - staked: fGSP  --------  mintAndStakeGsp, 与GSP同时质押
   - return: fsGSP
   - Reward: esGSX  (每秒多少)

# 3、领取GSX
## gspVester
- staked: esGSX、fsGSP  ----- deposit(质押)、claim(领取奖励)、withdraw(提取代币)
- Reward: GSX 

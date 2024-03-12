
// const { expect, use } = require("chai")
// const { solidity } = require("ethereum-waffle")
// const { deployContract } = require("../shared/fixtures")
// const { expandDecimals} = require("../shared/utilities")
// const { ethers } = require("hardhat")

// use(solidity)

// describe("Vault.settings", function () {
//   const provider = waffle.provider
//   const [wallet, user1, user2] = provider.getWallets()

//   let USDT
//   let USDT_ADDRESS = "0xdac17f958d2ee523a2206206994597c13d831ec7"
//   let USDT_HOLDER = "0xf977814e90da44bfa03b6295a0616a897441acec";

//   let BTC
//   let BTC_ADDRESS = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
//   let BTC_HOLDER = "0x6daB3bCbFb336b29d06B9C793AEF7eaA57888922"

//   let SAND 
//   let SAND_ADDRESS = "0x3845badAde8e6dFF049820680d1F14bD3903a5d0"
//   let SAND_HOLDER = "0x50260de69a417E8E5400Ac186c19D7d69Be8f705"
   
//   let WETH 
//   let WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
//   let WETH_HOLDER = "0x2feb1512183545f48f6b9c5b4ebfcaf49cfca6f3"

//   let ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

//   let AggregationRouter
//   let AggregationExcutor

//   beforeEach(async () => {

//         // 部署执行器
//         AggregationExcutor = await deployContract("AggregationExecutor",[]);
//         // 部署router
//         AggregationRouter = await deployContract("AggregationRouter",[]);
//         const USDT_ABI = require("./abi/usdt_abi.json");
//         const BTC_ABI = require("./abi/btc_abi.json");
//         const WETH_ABI = require("./abi/weth_abi.json");

//         BTC = new ethers.Contract(BTC_ADDRESS, BTC_ABI, ethers.provider);          
//         USDT = new ethers.Contract(USDT_ADDRESS, USDT_ABI, ethers.provider);
//         SAND = new ethers.Contract(SAND_ADDRESS, USDT_ABI, ethers.provider);    
//         WETH = new ethers.Contract(WETH_ADDRESS, WETH_ABI, ethers.provider);     
 
//         // 将binance 的 USDT 代币转移到 user1
//         await network.provider.request({
//             method: "hardhat_impersonateAccount",
//             params: [USDT_HOLDER],
//         });
//         const usdt_holder_signer = await ethers.provider.getSigner(USDT_HOLDER);
//         const tx1 = await USDT.connect(usdt_holder_signer).transfer(user1.address, expandDecimals(1000, 6));
//         await tx1.wait();

//         // 将 某 的 BTC 代币转移到user1
//         await network.provider.request({
//             method: "hardhat_impersonateAccount",
//             params: [BTC_HOLDER],
//         });

//         const btc_holder_signer = await ethers.provider.getSigner(BTC_HOLDER);
//         const tx2 = await BTC.connect(btc_holder_signer).transfer(user1.address, expandDecimals(1000, 8));
//         await tx2.wait();

//         // 将holder的  SAND 转移到 user1
//         await network.provider.request({
//             method: "hardhat_impersonateAccount",
//             params: [SAND_HOLDER],
//         });
//         const sand_holder_signer = await ethers.provider.getSigner(SAND_HOLDER);
//         const tx3 = await SAND.connect(sand_holder_signer).transfer(user1.address, expandDecimals(1000000, 18));
//         await tx3.wait();
        
//         // 将holder的  WETH 转移到 user1
//         await network.provider.request({
//             method: "hardhat_impersonateAccount",
//             params: [WETH_HOLDER],
//         });

//         const weth_holder_signer = await ethers.provider.getSigner(WETH_HOLDER);
//         const tx4 = await WETH.connect(weth_holder_signer).transfer(user1.address, expandDecimals(1000, 18));
//         await tx4.wait();
//     })

//     it("router swap USDT -> WETH, WETH -> USDT", async () => {
//         // router swap USDT -> WETH
//         expect(await USDT.balanceOf(user1.address)).eq(expandDecimals(1000, 6))
//         expect(await WETH.balanceOf(user2.address)).eq(0)

//         await USDT.connect(user1).approve(AggregationRouter.address, expandDecimals(1000, 6));
//         const desc = [USDT_ADDRESS, WETH_ADDRESS, AggregationExcutor.address, user2.address, expandDecimals(1000, 6), 1, 0];
//         var amountList = [0,0,expandDecimals(1000, 6),0,0,0,0]
//         await AggregationRouter.connect(user1).swap(AggregationExcutor.address, desc, "0x", amountList);

//         expect(await USDT.balanceOf(user1.address)).lt(expandDecimals(1000, 6))
//         expect(await WETH.balanceOf(user1.address)).gt(0)

//         //   router swap WETH -> USDT
//         expect(await WETH.balanceOf(user1.address)).eq(expandDecimals(1000, 18))
//         expect(await USDT.balanceOf(user2.address)).eq(0)

//         await WETH.connect(user1).approve(AggregationRouter.address, expandDecimals(100, 18));

//         const desc1= [WETH_ADDRESS, USDT_ADDRESS, AggregationExcutor.address, user2.address, expandDecimals(100, 18), 1, 0];
//         var amountList = [0,0,expandDecimals(100, 18),0,0,0,0]
//         await AggregationRouter.connect(user1).swap(AggregationExcutor.address, desc1, "0x", amountList);

//         expect(await WETH.balanceOf(user1.address)).lt(expandDecimals(1000, 18))
//         expect(await USDT.balanceOf(user2.address)).gt(0)
//   })
//     // it("excutor swap USDT -> WETH, WETH -> USDT", async () => {
//     //     // excutor swap USDT -> WETH
//     //     expect(await USDT.balanceOf(user1.address)).eq(expandDecimals(1000, 6))
//     //     expect(await WETH.balanceOf(user1.address)).eq(expandDecimals(1000, 18))

//     //     await USDT.connect(user1).transfer(AggregationExcutor.address, expandDecimals(1000, 6));
//     //     var amountList = [0,0,expandDecimals(1000, 6),0,0,0,0]
//     //     await AggregationExcutor.connect(user1).callBytes(USDT_ADDRESS, WETH_ADDRESS, expandDecimals(1000, 6), amountList);

//     //     expect(await USDT.balanceOf(user1.address)).eq(0)
//     //     expect(await WETH.balanceOf(user1.address)).gt(expandDecimals(1000, 18))

//     //     // excutor swap WETH -> USDT
//     //     expect(await WETH.balanceOf(user1.address)).eq(`1000000000945367379890`)
//     //     expect(await USDT.balanceOf(user1.address)).eq(0)

//     //     await WETH.connect(user1).transfer(AggregationExcutor.address, expandDecimals(1, 18));
//     //     var amountList = [0,0,expandDecimals(1, 18),0,0,0,0]
//     //     await AggregationExcutor.connect(user1).callBytes(WETH_ADDRESS, USDT_ADDRESS, expandDecimals(1, 18), amountList);

//     //     expect(await WETH.balanceOf(user1.address)).lt(`1000000000945367379890`)
//     //     expect(await USDT.balanceOf(user1.address)).gt(0)
//     // })

//     // it("router swap SAND -> USDT", async () => {

//     //     // router swap

//     //     expect(await SAND.balanceOf(user1.address)).eq(expandDecimals(1000000, 18))
//     //     expect(await USDT.balanceOf(user2.address)).eq(0)

//     //     await SAND.connect(user1).approve(AggregationRouter.address, expandDecimals(1000000, 18));
//     //     const desc = [SAND_ADDRESS, USDT_ADDRESS, AggregationExcutor.address, user2.address, expandDecimals(1000000, 18), 1, 0];
//     //     var amountList = [0,0,expandDecimals(1000000, 18),0,0,0,0]
//     //     await AggregationRouter.connect(user1).swap(AggregationExcutor.address, desc, "0x", amountList);

//     //     expect(await SAND.balanceOf(user1.address)).eq(0)
//     //     expect(await USDT.balanceOf(user2.address)).gt(0)

//     // })

//     // it("excutor swap SAND -> USDT", async () => {
//     //     expect(await SAND.balanceOf(user1.address)).eq(expandDecimals(1000000, 18))
//     //     expect(await USDT.balanceOf(user1.address)).eq(expandDecimals(1000, 6))

//     //     // excutor swap
//     //     await SAND.connect(user1).transfer(AggregationExcutor.address, expandDecimals(1000000, 18));
//     //     var amountList = [0,0,expandDecimals(1, 18),0,0,0,0]
//     //     await AggregationExcutor.connect(user1).callBytes(SAND_ADDRESS, USDT_ADDRESS, expandDecimals(1000000, 18), amountList);

//     //     expect(await SAND.balanceOf(user1.address)).eq(0)
//     //     expect(await USDT.balanceOf(user1.address)).gt(expandDecimals(1000, 6))
//     // })
// })

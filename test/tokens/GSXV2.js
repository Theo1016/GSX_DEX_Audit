// const { expect, use } = require('chai');
// const { solidity } = require("ethereum-waffle")
// const { ethers, upgrades } = require("hardhat");

// use(solidity);

// function bigNumberify(n) {
//     return ethers.BigNumber.from(n)
//   }
  
// function expandDecimals(n, decimals) {
// return bigNumberify(n).mul(bigNumberify(10).pow(decimals))
// }

// describe("Test GSX Interface", function () {
//     var OWNER;
//     var user1;
//     var user2;
//     var user3;

//     var GSXTOKEN;

//     beforeEach(async () => {
//         [OWNER, feerecever, user1, user2, user3, user4] = await ethers.getSigners();
//         const GSXParse = await ethers.getContractFactory("GSXV2", OWNER);
//         GSXTOKEN = await upgrades.deployProxy(
//             GSXParse,
//             [],
//             {initializer:"initialize"});
//         await GSXTOKEN.deployed();
//     });

//     it("init", async function () {
//         expect(await GSXTOKEN.name()).eq('GSX')
//         expect(await GSXTOKEN.balanceOf(OWNER.address)).eq(`1000000000000000000000`)
//         expect(await GSXTOKEN.whitelistMint(user1.address)).eq(false)
//         expect(await GSXTOKEN.whitelistMint(OWNER.address)).eq(false)
//     })

//     it("setMinte、 transfer", async function () {
//         // set minter
//         expect(await GSXTOKEN.whitelistMint(OWNER.address)).eq(false)

//         await GSXTOKEN.setWhitelistMintBurn(OWNER.address, true);

//         expect(await GSXTOKEN.whitelistMint(OWNER.address)).eq(true)

//         expect(await GSXTOKEN.isExcludedFromReward(OWNER.address)).eq(false)
//         expect(await GSXTOKEN.isExcludedFromReward(user1.address)).eq(false)
//         expect(await GSXTOKEN.isExcludedFromReward(user2.address)).eq(false)

//         expect(await GSXTOKEN.balanceOf(OWNER.address)).eq(`1000000000000000000000`)
//         expect(await GSXTOKEN.balanceOf(user1.address)).eq(0)
//         expect(await GSXTOKEN.balanceOf(user2.address)).eq(0)

//         await GSXTOKEN.transfer(user1.address, expandDecimals(1000, 9))

//         expect(await GSXTOKEN.balanceOf(OWNER.address)).eq(`999999999000000000000`)
//         expect(await GSXTOKEN.balanceOf(user1.address)).eq('1000000000000')
//         expect(await GSXTOKEN.balanceOf(user2.address)).eq(0)

//         await GSXTOKEN.connect(user1).transfer(user2.address, expandDecimals(100, 9))
    
//         // liquidityFee: 5%   taxFee: 5% 
//         expect(await GSXTOKEN.balanceOf(OWNER.address)).eq(`999999999004999999995`)  // 999999999004999999995 - 999999999000000000000 = 4999999995
//         expect(await GSXTOKEN.balanceOf(user1.address)).eq(`900000000004`) // 1000000000000 - 100000000000 + 4 =  900000000004
//         expect(await GSXTOKEN.balanceOf(user2.address)).eq(`90000000000`) //  100000000000 - 10000000000 = 90000000000
//         expect(await GSXTOKEN.balanceOf(user3.address)).eq(0)

//         await GSXTOKEN.connect(user2).transfer(user3.address, expandDecimals(10, 9))

//         expect(await GSXTOKEN.balanceOf(OWNER.address)).eq(`999999999005499999994`)
//         expect(await GSXTOKEN.balanceOf(user1.address)).eq(`900000000004`)
//         expect(await GSXTOKEN.balanceOf(user2.address)).eq(`80000000000`)
//         expect(await GSXTOKEN.balanceOf(user3.address)).eq(`9000000000`)
        
//         expect(await GSXTOKEN.balanceOf('0xb64874f6c35fc3B0D8C4A0bC3e443A734430b982')).eq(0)
//         expect(await GSXTOKEN.balanceOf('0x0000000000000000000000000000000000000000')).eq(0)

//     });



// });
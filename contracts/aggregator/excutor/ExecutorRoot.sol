// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./interfaces/IPancakeFactory.sol";
import "./interfaces/IPancakeV3Factory.sol";
import "./interfaces/IUniswapV3Factory.sol";
import "./interfaces/IUniswapV3Router.sol";
import "./interfaces/IQuoter.sol";

contract ExecutorRoot {
    IUniswapV3Factory public uniswapV3Factory;

    // *****************
    // **like uniswapV2*
    // *****************
    IPancakeFactory constant public PancakeFactory = IPancakeFactory(0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73);
    IPancakeFactory constant public PancakeFactoryO = IPancakeFactory(0xBCfCcbde45cE874adCB698cC183deBcF17952812);
    // IPancakeFactory constant public ApeFactory = IPancakeFactory(0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6);  // bsc

    IPancakeFactory constant public ApeFactory = IPancakeFactory(0xBAe5dc9B19004883d0377419FeF3c2C8832d7d7B);  // eth

    
    IPancakeFactory constant public BakerySwapFactory = IPancakeFactory(0x01bF7C66c6BD861915CdaaE475042d3c4BaE16A7); 
    IPancakeFactory constant public BSCswapFactory = IPancakeFactory(0x553990F2CBA90272390f62C5BDb1681fFc899675);
    IPancakeFactory constant public WaultSwapFactory = IPancakeFactory(0xB42E3FE71b7E0673335b3331B3e1053BD9822570);
    IPancakeFactory constant public ThugswapFactory = IPancakeFactory(0xaC653cE27E04C6ac565FD87F18128aD33ca03Ba2);


    // ******************
    // **like uniswapV3**
    // ******************
    // ISwapRouter public constant pancakeV3Router = ISwapRouter(0x13f4EA83D0bd40E75C8222255bc855a974568Dd4);
    // ISwapRouter public constant uniswapV3Router = ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);
    // IQuoter public constant quoter = IQuoter(0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6);
    
}
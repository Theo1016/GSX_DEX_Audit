require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-contract-sizer")
require('@openzeppelin/hardhat-upgrades');
require("solidity-coverage")

const {
  BSC_URL,
  BSC_DEPLOY_KEY,
  BSCSCAN_API_KEY,
  
  BSC_TESTNET_URL,
  BSC_TESTNET_DEPLOY_KEY,
} = require("./env.json")

const getEnvAccounts = (DEFAULT_DEPLOYER_KEY) => {
  return [DEFAULT_DEPLOYER_KEY];
};

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners()

  for (const account of accounts) {
    console.info(account.address)
  }
})

task("balance", "Prints an account's balance")
  .addParam("account", "The account's address")
  .setAction(async (taskArgs) => {
    const balance = await ethers.provider.getBalance(taskArgs.account);

    console.log(ethers.utils.formatEther(balance), "ETH");
  });

task("processFees", "Processes fees")
  .addParam("steps", "The steps to run")
  .setAction(async (taskArgs) => {
    const { processFees } = require("./scripts/core/processFees")
    await processFees(taskArgs)
  })

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    localhost: {
      timeout: 120000
    },
    hardhat: {
      forking: {
        url: "https://eth-mainnet.g.alchemy.com/v2/tMng-MVObRxp0IYUhO5LYOW5H66TO3ZJ",
        // 如果不写blockNumber参数，那么默认fork的是最新区块的数据。
        blockNumber: 19024848
      }
    },
    bsc: {
      url: BSC_URL,
      chainId: 56,
      gasPrice: 10000000000,
      accounts: getEnvAccounts(BSC_DEPLOY_KEY)
    },
    bscTest: {
      url: BSC_TESTNET_URL,
      chainId: 97,
      gasPrice: 20000000000,
      accounts: getEnvAccounts(BSC_TESTNET_DEPLOY_KEY)
    },
  },
  etherscan: {
    apiKey: {
      bscTestnet: BSCSCAN_API_KEY,
    }
  },
  solidity: {
    compilers: [
        {
          paths: [
            "./aggregator"
          ],
          version: "0.8.17",
          settings: {
            optimizer: {
              enabled: true,
              runs: 10,
              details: {
                constantOptimizer: true,
              },
            },
          },
        },
        {
          paths: [
            "./dex"
          ],
          version: "0.6.12",
          settings: {
            optimizer: {
              enabled: true,
              runs: 20
            }
          },
        },
        {
          paths: [
            "./gsxToken"
          ],
          version: "0.8.11",
          settings: {
            optimizer: {
              enabled: true,
              runs: 20
            }
          },
        }
    ]
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
}

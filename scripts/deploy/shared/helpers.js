async function sendTxn(txnPromise, label) {
  console.info(`Processsing ${label}:`)
  const txn = await txnPromise
  console.info(`Sending ${label}...`)
  await txn.wait(2)
  console.info(`... Sent! ${txn.hash}`)
  return txn
}


async function deployContract(name, args, label, options) {
  if (!options && typeof label === "object") {
    label = null
    options = label
  }

  let info = name
  if (label) { info = name + ":" + label }
  const contractFactory = await ethers.getContractFactory(name)
  let contract
  if (options) {
    contract = await contractFactory.deploy(...args, options)
  } else {
    contract = await contractFactory.deploy(...args)
  }
  const argStr = args.map((i) => `"${i}"`).join(" ")
  console.info(`Deploying ${info} ${contract.address} ${argStr}`)
  await contract.deployTransaction.wait()
  console.info("... Completed!")
  return contract
}


async function deployContractWithLib(name, args, options) {

  const contractFactory = await ethers.getContractFactory(name,options)

  let contract = await contractFactory.deploy(...args)
  const argStr = args.map((i) => `"${i}"`).join(" ")

  console.info(`Deploying ${name} ${contract.address} ${argStr}`)
  console.info("... Completed!")
  return contract
}

async function contractAtLib(name, address, options) {
  let contractFactory = await ethers.getContractFactory(name, options)
  return await contractFactory.attach(address)
}

async function contractAt(name, address, provider, options) {
  let contractFactory = await ethers.getContractFactory(name, options)
  if (provider) {
    contractFactory = contractFactory.connect(provider)
  }
  return await contractFactory.attach(address)
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
  sendTxn,
  deployContract,
  contractAt,
  deployContractWithLib,
  contractAtLib,
  errors
}

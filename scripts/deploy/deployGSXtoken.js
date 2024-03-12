
async function main() {
    const GSXParser = await ethers.getContractFactory("GSXV2");
    const GSXTOKEN = await upgrades.deployProxy(GSXParser, [], { initializer: 'initialize' });
    await GSXTOKEN.deployed();
    console.log("GSXTOKEN deployed to:", GSXTOKEN.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

const hre = require("hardhat");

async function main() {
  const Exchange = await hre.ethers.getContractFactory("Exchange");
  const greeter = await Exchange.deploy();

  await greeter.deployed();

  console.log("Exchange deployed to:", greeter.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

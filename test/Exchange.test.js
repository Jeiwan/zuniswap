const { expect } = require("chai");

describe("Exchange", () => {
  let owner;
  let exchange;

  before(async () => {
    [owner] = await ethers.getSigners();

    const Exchange = await ethers.getContractFactory("Exchange");
    exchange = await Exchange.deploy();
    await exchange.deployed();
  });

  it("is deployed", async () => {
    expect(await exchange.deployed()).to.equal(exchange);
  });
});

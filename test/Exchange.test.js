const { expect } = require("chai");

describe("Exchange", () => {
  let owner;
  let exchange;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("Token", "TKN", 1000000);
    await token.deployed();

    const Exchange = await ethers.getContractFactory("Exchange");
    exchange = await Exchange.deploy(token.address);
    await exchange.deployed();
  });

  describe("addLiquidity", async () => {
    it("adds liquidity", async () => {
      await token.approve(exchange.address, 2000);
      await exchange.addLiquidity(2000, { value: 1000 });

      expect(await ethers.provider.getBalance(exchange.address)).to.equal(1000);
      expect(await exchange.getReserve()).to.equal(2000);
    });

    it("allows zero amounts", async () => {
      await token.approve(exchange.address, 0);
      await exchange.addLiquidity(0, { value: 0 });

      expect(await ethers.provider.getBalance(exchange.address)).to.equal(0);
      expect(await exchange.getReserve()).to.equal(0);
    });
  });

  it("is deployed", async () => {
    expect(await exchange.deployed()).to.equal(exchange);
  });
});

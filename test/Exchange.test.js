const { expect } = require("chai");

const toWei = (value) => ethers.utils.parseEther(value.toString());

describe("Exchange", () => {
  let owner;
  let exchange;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("Token", "TKN", toWei(1000000));
    await token.deployed();

    const Exchange = await ethers.getContractFactory("Exchange");
    exchange = await Exchange.deploy(token.address);
    await exchange.deployed();
  });

  it("is deployed", async () => {
    expect(await exchange.deployed()).to.equal(exchange);
  });

  describe("addLiquidity", async () => {
    it("adds liquidity", async () => {
      await token.approve(exchange.address, toWei(200));
      await exchange.addLiquidity(toWei(200), { value: toWei(100) });

      expect(await ethers.provider.getBalance(exchange.address)).to.equal(
        toWei(100)
      );
      expect(await exchange.getReserve()).to.equal(toWei(200));
    });

    it("allows zero amounts", async () => {
      await token.approve(exchange.address, 0);
      await exchange.addLiquidity(0, { value: 0 });

      expect(await ethers.provider.getBalance(exchange.address)).to.equal(0);
      expect(await exchange.getReserve()).to.equal(0);
    });
  });

  describe("getEthToTokenPrice", async () => {
    it("returns correct exchange price", async () => {
      await token.approve(exchange.address, toWei(2000));
      await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });

      expect(await exchange.getEthToTokenPrice(toWei(1))).to.equal(2000);
    });
  });

  describe("getTokenToEthPrice", async () => {
    it("returns correct exchange price", async () => {
      await token.approve(exchange.address, toWei(2000));
      await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });

      expect(await exchange.getTokenToEthPrice(toWei(2))).to.equal(500);
    });
  });
});

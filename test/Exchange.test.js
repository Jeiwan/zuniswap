const { expect } = require("chai");

const toWei = (value) => ethers.utils.parseEther(value.toString());

const fromWei = (value) => ethers.utils.formatEther(value);

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

  describe("getTokenAmount", async () => {
    it("returns correct exchange price", async () => {
      await token.approve(exchange.address, toWei(2000));
      await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });

      let tokensOut = await exchange.getTokenAmount(toWei(1));
      expect(fromWei(tokensOut)).to.equal("1.998001998001998001");

      tokensOut = await exchange.getTokenAmount(toWei(100));
      expect(fromWei(tokensOut)).to.equal("181.818181818181818181");

      tokensOut = await exchange.getTokenAmount(toWei(1000));
      expect(fromWei(tokensOut)).to.equal("1000.0");
    });
  });

  describe("getEthAmount", async () => {
    it("returns correct exchange price", async () => {
      await token.approve(exchange.address, toWei(2000));
      await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });

      let ethOut = await exchange.getEthAmount(toWei(2));
      expect(fromWei(ethOut)).to.equal("0.999000999000999");

      ethOut = await exchange.getEthAmount(toWei(100));
      expect(fromWei(ethOut)).to.equal("47.619047619047619047");

      ethOut = await exchange.getEthAmount(toWei(2000));
      expect(fromWei(ethOut)).to.equal("500.0");
    });
  });
});

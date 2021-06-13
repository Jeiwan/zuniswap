require("@nomiclabs/hardhat-waffle");
const { expect } = require("chai");

const toWei = (value) => ethers.utils.parseEther(value.toString());

const fromWei = (value) =>
  ethers.utils.formatEther(
    typeof value === "string" ? value : value.toString()
  );

const getBalance = ethers.provider.getBalance;

describe("Exchange", () => {
  let owner;
  let user;
  let exchange;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

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
    describe("empty reserves", async () => {
      it("adds liquidity", async () => {
        await token.approve(exchange.address, toWei(200));
        await exchange.addLiquidity(toWei(200), { value: toWei(100) });

        expect(await getBalance(exchange.address)).to.equal(toWei(100));
        expect(await exchange.getReserve()).to.equal(toWei(200));
      });

      it("allows zero amounts", async () => {
        await token.approve(exchange.address, 0);
        await exchange.addLiquidity(0, { value: 0 });

        expect(await getBalance(exchange.address)).to.equal(0);
        expect(await exchange.getReserve()).to.equal(0);
      });
    });

    describe("existing reserves", async () => {
      beforeEach(async () => {
        await token.approve(exchange.address, toWei(300));
        await exchange.addLiquidity(toWei(200), { value: toWei(100) });
      });

      it("preserves exchange rate", async () => {
        await exchange.addLiquidity(toWei(200), { value: toWei(50) });

        expect(await getBalance(exchange.address)).to.equal(toWei(150));
        expect(await exchange.getReserve()).to.equal(toWei(300));
      });

      it("fails when not enough tokens", async () => {
        await expect(
          exchange.addLiquidity(toWei(50), { value: toWei(50) })
        ).to.be.revertedWith("insufficient token amount");
      });
    });
  });

  describe("getTokenAmount", async () => {
    it("returns correct token amount", async () => {
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
    it("returns correct ether amount", async () => {
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

  describe("ethToTokenSwap", async () => {
    beforeEach(async () => {
      await token.approve(exchange.address, toWei(2000));
      await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });
    });

    it("transfers at least min amount of tokens", async () => {
      const userBalanceBefore = await getBalance(user.address);

      await exchange
        .connect(user)
        .ethToTokenSwap(toWei(1.99), { value: toWei(1) });

      const userBalanceAfter = await getBalance(user.address);
      expect(fromWei(userBalanceAfter - userBalanceBefore)).to.equal(
        "-1.0000000000102236"
      );

      const userTokenBalance = await token.balanceOf(user.address);
      expect(fromWei(userTokenBalance)).to.equal("1.998001998001998001");

      const exchangeEthBalance = await getBalance(exchange.address);
      expect(fromWei(exchangeEthBalance)).to.equal("1001.0");

      const exchangeTokenBalance = await token.balanceOf(exchange.address);
      expect(fromWei(exchangeTokenBalance)).to.equal("1998.001998001998001999");
    });

    it("affects exchange rate", async () => {
      let tokensOut = await exchange.getTokenAmount(toWei(10));
      expect(fromWei(tokensOut)).to.equal("19.80198019801980198");

      await exchange
        .connect(user)
        .ethToTokenSwap(toWei(9), { value: toWei(10) });

      tokensOut = await exchange.getTokenAmount(toWei(10));
      expect(fromWei(tokensOut)).to.equal("19.413706076490001941");
    });

    it("fails when output amount is less than min amount", async () => {
      await expect(
        exchange.connect(user).ethToTokenSwap(toWei(2), { value: toWei(1) })
      ).to.be.revertedWith("insufficient output amount");
    });

    it("allows zero swaps", async () => {
      await exchange
        .connect(user)
        .ethToTokenSwap(toWei(0), { value: toWei(0) });

      const userTokenBalance = await token.balanceOf(user.address);
      expect(fromWei(userTokenBalance)).to.equal("0.0");

      const exchangeEthBalance = await getBalance(exchange.address);
      expect(fromWei(exchangeEthBalance)).to.equal("1000.0");

      const exchangeTokenBalance = await token.balanceOf(exchange.address);
      expect(fromWei(exchangeTokenBalance)).to.equal("2000.0");
    });
  });

  describe("tokenToEthSwap", async () => {
    beforeEach(async () => {
      await token.transfer(user.address, toWei(22));
      await token.connect(user).approve(exchange.address, toWei(22));

      await token.approve(exchange.address, toWei(2000));
      await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });
    });

    it("transfers at least min amount of tokens", async () => {
      const userBalanceBefore = await getBalance(user.address);
      const exchangeBalanceBefore = await getBalance(exchange.address);

      await exchange.connect(user).tokenToEthSwap(toWei(2), toWei(0.9));

      const userBalanceAfter = await getBalance(user.address);
      expect(fromWei(userBalanceAfter - userBalanceBefore)).to.equal(
        "0.9990009989386732"
      );

      const userTokenBalance = await token.balanceOf(user.address);
      expect(fromWei(userTokenBalance)).to.equal("20.0");

      const exchangeBalanceAfter = await getBalance(exchange.address);
      expect(fromWei(exchangeBalanceAfter - exchangeBalanceBefore)).to.equal(
        "-0.9990009990010634"
      );

      const exchangeTokenBalance = await token.balanceOf(exchange.address);
      expect(fromWei(exchangeTokenBalance)).to.equal("2002.0");
    });

    it("affects exchange rate", async () => {
      let ethOut = await exchange.getEthAmount(toWei(20));
      expect(fromWei(ethOut)).to.equal("9.90099009900990099");

      await exchange.connect(user).tokenToEthSwap(toWei(20), toWei(9));

      ethOut = await exchange.getEthAmount(toWei(20));
      expect(fromWei(ethOut)).to.equal("9.70685303824500097");
    });

    it("fails when output amount is less than min amount", async () => {
      await expect(
        exchange.connect(user).tokenToEthSwap(toWei(2), toWei(1.0))
      ).to.be.revertedWith("insufficient output amount");
    });

    it("allows zero swaps", async () => {
      const userBalanceBefore = await getBalance(user.address);
      await exchange.connect(user).tokenToEthSwap(toWei(0), toWei(0));

      const userBalanceAfter = await getBalance(user.address);
      expect(fromWei(userBalanceAfter - userBalanceBefore)).to.equal(
        "-0.000000000134217728"
      );

      const userTokenBalance = await token.balanceOf(user.address);
      expect(fromWei(userTokenBalance)).to.equal("22.0");

      const exchangeEthBalance = await getBalance(exchange.address);
      expect(fromWei(exchangeEthBalance)).to.equal("1000.0");

      const exchangeTokenBalance = await token.balanceOf(exchange.address);
      expect(fromWei(exchangeTokenBalance)).to.equal("2000.0");
    });
  });
});

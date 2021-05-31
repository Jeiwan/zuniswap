//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Exchange {
    address public tokenAddress;

    constructor(address _token) {
        require(_token != address(0), "invalid token address");

        tokenAddress = _token;
    }

    function addLiquidity(uint256 _tokenAmount) public payable {
        IERC20 token = IERC20(tokenAddress);
        token.transferFrom(msg.sender, address(this), _tokenAmount);
    }

    function getReserve() public view returns (uint256) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    function getEthToTokenPrice(uint256 _ethSold)
        public
        view
        returns (uint256)
    {
        require(_ethSold > 0, "ethSold is too small");

        uint256 tokenReserve = getReserve();

        return _getPrice(_ethSold, address(this).balance, tokenReserve);
    }

    function getTokenToEthPrice(uint256 _tokenSold)
        public
        view
        returns (uint256)
    {
        require(_tokenSold > 0, "tokenSold is too small");

        uint256 tokenReserve = getReserve();

        return _getPrice(_tokenSold, tokenReserve, address(this).balance);
    }

    function _getPrice(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) private pure returns (uint256) {
        require(inputReserve > 0 && outputReserve > 0, "invalid reserves");

        return (outputReserve * 1000) / inputReserve;
    }
}

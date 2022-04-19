//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.7;

import "@rytell/exchange-contracts/contracts/core/interfaces/IRytellPair.sol";
import "@rytell/exchange-contracts/contracts/core/interfaces/IRytellFactory.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./libraries/Math.sol";
import "./libraries/SafeMath.sol";

contract CalculatePrice {
  using SafeMath for uint256;

  address public avax;
  address public radi;
  address public usdc;
  address public factory;
  uint256 public baseUsdPrice;

  constructor(
    address _avax,
    address _usdc,
    address _radi,
    address _factory,
    uint256 _baseUsdPrice
  ) {
    avax = _avax;
    usdc = _usdc;
    radi = _radi;
    factory = _factory;
    baseUsdPrice = _baseUsdPrice;
  }

  function getPairAddress(address token1, address token2)
    public
    view
    returns (address)
  {
    address pair = IRytellFactory(factory).getPair(token1, token2);
    return pair;
  }

  function getLandPriceInTokens() public view returns (uint256, uint256) {
    address avaxUsdc = getPairAddress(avax, usdc);
    uint256 balanceAvax = IERC20(avax).balanceOf(avaxUsdc);
    uint256 balanceUsdc = IERC20(usdc).balanceOf(avaxUsdc);

    uint256 landPriceAvax = (baseUsdPrice * balanceAvax * 1000000000000000000) /
      (balanceUsdc * (1000000000000) * 2);

    address avaxRadi = getPairAddress(avax, radi);
    uint256 balanceAvaxInRadiPair = IERC20(avax).balanceOf(avaxRadi);
    uint256 balanceRadi = IERC20(radi).balanceOf(avaxRadi);

    uint256 amountRadi = (landPriceAvax * balanceRadi) / balanceAvaxInRadiPair;

    return (landPriceAvax, amountRadi);
  }

  function getPrice()
    external
    view
    returns (
      uint256,
      uint256,
      uint256 lpTokensAmount
    )
  {
    (uint256 avaxAmount, uint256 radiAmount) = getLandPriceInTokens();

    address avaxRadi = getPairAddress(avax, radi);
    uint256 lpTotalSupply = IRytellPair(avaxRadi).totalSupply();
    (uint112 _reserve0, uint112 _reserve1, ) = IRytellPair(avaxRadi)
      .getReserves();
    address token0 = IRytellPair(avaxRadi).token0();

    if (lpTotalSupply == 0) {
      lpTokensAmount = Math.sqrt(avaxAmount.mul(radiAmount));
    } else {
      if (token0 == avax) {
        lpTokensAmount = Math.min(
          avaxAmount.mul(lpTotalSupply) / _reserve0,
          radiAmount.mul(lpTotalSupply) / _reserve1
        );
      } else {
        lpTokensAmount = Math.min(
          avaxAmount.mul(lpTotalSupply) / _reserve1,
          radiAmount.mul(lpTotalSupply) / _reserve0
        );
      }
    }
    require(lpTokensAmount > 0, "Rytell: INSUFFICIENT_LIQUIDITY_MINTED");
    return (avaxAmount, radiAmount, lpTokensAmount);
  }
}

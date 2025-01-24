// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SwapContract is ERC20, Ownable, ReentrancyGuard {
    IERC20 public rangerToken;
    uint256 public liquidityMintMe;
    uint256 public liquidityRanger;
    uint256 public feePercentage = 1; // 1% fee

    event LiquidityAdded(address indexed provider, uint256 mintMeAmount, uint256 rangerAmount, uint256 lpTokensMinted);
    event LiquidityRemoved(address indexed provider, uint256 mintMeAmount, uint256 rangerAmount, uint256 lpTokensBurned);
    event Swapped(address indexed swapper, uint256 inputAmount, uint256 outputAmount, bool isMintMeToRanger);
    event FeeCollected(address indexed owner, uint256 amount);

    constructor(address _rangerToken, address initialOwner) ERC20("Liquidity Provider Token", "LPT") Ownable(initialOwner) {
        rangerToken = IERC20(_rangerToken);
    }

    function addLiquidity(uint256 rangerAmount) external payable nonReentrant {
        require(msg.value > 0, "MintMe amount must be greater than 0");
        require(rangerAmount > 0, "RANGER amount must be greater than 0");

        uint256 lpTokensMinted;

        if (liquidityMintMe > 0 && liquidityRanger > 0) {
            uint256 mintMeRequired = (rangerAmount * liquidityMintMe) / liquidityRanger;
            require(msg.value >= mintMeRequired, "Incorrect MintMe amount based on current pool");

            // Transfer only the required amount of MintMe, refund excess
            if (msg.value > mintMeRequired) {
                payable(msg.sender).transfer(msg.value - mintMeRequired);
            }

            lpTokensMinted = (rangerAmount * totalSupply()) / liquidityRanger;
        } else {
            lpTokensMinted = rangerAmount;
        }

        // Transfer RANGER tokens from the provider to the contract
        require(rangerToken.transferFrom(msg.sender, address(this), rangerAmount), "Transfer failed");

        liquidityMintMe += msg.value;
        liquidityRanger += rangerAmount;

        _mint(msg.sender, lpTokensMinted);

        emit LiquidityAdded(msg.sender, msg.value, rangerAmount, lpTokensMinted);
    }

    function removeLiquidity(uint256 lpTokenAmount) external nonReentrant {
        require(lpTokenAmount > 0, "Invalid LP token amount");

        uint256 mintMeAmount = (lpTokenAmount * liquidityMintMe) / totalSupply();
        uint256 rangerAmount = (lpTokenAmount * liquidityRanger) / totalSupply();

        liquidityMintMe -= mintMeAmount;
        liquidityRanger -= rangerAmount;

        _burn(msg.sender, lpTokenAmount);
        payable(msg.sender).transfer(mintMeAmount);
        require(rangerToken.transfer(msg.sender, rangerAmount), "Transfer failed");

        emit LiquidityRemoved(msg.sender, mintMeAmount, rangerAmount, lpTokenAmount);
    }

    function swapMintMeToRanger(uint256 mintMeAmount) external payable nonReentrant {
        require(msg.value == mintMeAmount, "Incorrect MintMe amount sent");
        require(liquidityRanger > 0, "Insufficient liquidity");

        uint256 fee = (mintMeAmount * feePercentage) / 100;
        uint256 amountAfterFee = mintMeAmount - fee;
        uint256 rangerAmount = (amountAfterFee * liquidityRanger) / liquidityMintMe;

        require(rangerToken.transfer(msg.sender, rangerAmount), "Transfer failed");

        liquidityMintMe += mintMeAmount;
        liquidityRanger -= rangerAmount;

        payable(owner()).transfer(fee);

        emit Swapped(msg.sender, mintMeAmount, rangerAmount, true);
        emit FeeCollected(owner(), fee);
    }

    function swapRangerToMintMe(uint256 rangerAmount) external nonReentrant {
        require(rangerAmount > 0, "Invalid RANGER amount");
        require(liquidityMintMe > 0, "Insufficient liquidity");

        uint256 fee = (rangerAmount * feePercentage) / 100;
        uint256 amountAfterFee = rangerAmount - fee;
        uint256 mintMeAmount = (amountAfterFee * liquidityMintMe) / liquidityRanger;

        require(rangerToken.transferFrom(msg.sender, address(this), rangerAmount), "Transfer failed");
        payable(msg.sender).transfer(mintMeAmount);

        liquidityRanger += rangerAmount;
        liquidityMintMe -= mintMeAmount;

        require(rangerToken.transfer(owner(), fee), "Fee transfer failed");

        emit Swapped(msg.sender, rangerAmount, mintMeAmount, false);
        emit FeeCollected(owner(), fee);
    }

    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 10, "Fee can't be more than 10%");
        feePercentage = _feePercentage;
    }

    function getLiquidity() external view returns (uint256, uint256) {
        return (liquidityMintMe, liquidityRanger);
    }
}
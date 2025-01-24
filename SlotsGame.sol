// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SlotMachine is Ownable {
    IERC20 public token;
    uint256 public betAmount;
    uint256 public winMultiplier; // Multiplier for winnings (e.g., 2 means 2x the bet amount)
    uint256 public houseEdge; // House edge in percentage (e.g., 2 means 2%)

    event Spin(address indexed player, uint256 betAmount, uint256 result, bool won, uint256 payout);

    struct Game {
        address addr;
        uint256 blocknumber;
        uint256 blocktimestamp;
        uint256 bet;
        uint256 prize;
        bool winner;
    }

    Game[] public lastPlayedGames;

    constructor(
        address tokenAddress,
        uint256 _betAmount,
        uint256 _winMultiplier,
        uint256 _houseEdge
    ) Ownable(msg.sender) { // Pass msg.sender to Ownable constructor
        token = IERC20(tokenAddress);
        betAmount = _betAmount;
        winMultiplier = _winMultiplier;
        houseEdge = _houseEdge;
    }

    function setBetAmount(uint256 _betAmount) external onlyOwner {
        betAmount = _betAmount;
    }

    function setWinMultiplier(uint256 _winMultiplier) external onlyOwner {
        winMultiplier = _winMultiplier;
    }

    function setHouseEdge(uint256 _houseEdge) external onlyOwner {
        houseEdge = _houseEdge;
    }

    function spin() external {
        require(token.transferFrom(msg.sender, address(this), betAmount), "Bet transfer failed");

        uint256 randomNumber = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.difficulty))) % 100;
        bool won = randomNumber < 10; // 10% chance to win
        uint256 payout = 0;

        if (won) {
            payout = (betAmount * winMultiplier * (100 - houseEdge)) / 100;
            require(token.transfer(msg.sender, payout), "Payout transfer failed");
        }

        emit Spin(msg.sender, betAmount, randomNumber, won, payout);
        
        // Record the game
        lastPlayedGames.push(Game({
            addr: msg.sender,
            blocknumber: block.number,
            blocktimestamp: block.timestamp,
            bet: betAmount,
            prize: payout,
            winner: won
        }));
    }

    function withdrawTokens(uint256 amount) external onlyOwner {
        require(token.transfer(owner(), amount), "Withdraw transfer failed");
    }

    function withdrawEth() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function getGameCount() external view returns (uint256) {
        return lastPlayedGames.length;
    }

    function getGameEntry(uint256 index) external view returns (address addr, uint256 blocknumber, uint256 blocktimestamp, uint256 bet, uint256 prize, bool winner) {
        Game memory game = lastPlayedGames[index];
        return (game.addr, game.blocknumber, game.blocktimestamp, game.bet, game.prize, game.winner);
    }

    receive() external payable {}
}
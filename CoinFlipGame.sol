// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CoinFlip {
    address public owner;
    uint public payPercentage = 50;

    // Maximum amount to bet in WEIs
    uint public MaxAmountToBet = 2000 ether;

    struct Game {
        address addr;
        uint blocknumber;
        uint blocktimestamp;
        uint bet;
        uint prize;
        bool winner;
    }

    Game[] public lastPlayedGames;

    event Status(
        string _msg,
        address indexed user,
        uint amount,
        bool winner
    );

    constructor() payable {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    function Play() external payable {
        require(msg.value > 0, "Bet amount must be greater than zero");
        require(msg.value <= MaxAmountToBet, "Bet amount exceeds maximum limit");

        // Use the hash of the current block and the player's address to determine the outcome
        bytes32 hash = keccak256(abi.encodePacked(blockhash(block.number - 1), msg.sender));
        uint random = uint(hash) % 100;

        if (random < 25) { // 25% chance to win
            uint prize = msg.value * (100 + payPercentage) / 100;
            if (address(this).balance < prize) {
                prize = address(this).balance;
                payable(msg.sender).transfer(prize);
                emit Status("Congratulations, you win! Sorry, we didn't have enough money, we will deposit everything we have!", msg.sender, msg.value, true);
            } else {
                payable(msg.sender).transfer(prize);
                emit Status("Congratulations, you win!", msg.sender, prize, true);
            }
            lastPlayedGames.push(Game({
                addr: msg.sender,
                blocknumber: block.number,
                blocktimestamp: block.timestamp,
                bet: msg.value,
                prize: prize,
                winner: true
            }));
        } else {
            emit Status("Sorry, you lose!", msg.sender, msg.value, false);
            lastPlayedGames.push(Game({
                addr: msg.sender,
                blocknumber: block.number,
                blocktimestamp: block.timestamp,
                bet: msg.value,
                prize: 0,
                winner: false
            }));
        }
    }

    function getGameCount() external view returns (uint) {
        return lastPlayedGames.length;
    }

    function getGameEntry(uint index) external view returns (address addr, uint blocknumber, uint blocktimestamp, uint bet, uint prize, bool winner) {
        Game memory game = lastPlayedGames[index];
        return (game.addr, game.blocknumber, game.blocktimestamp, game.bet, game.prize, game.winner);
    }

    function depositFunds() external onlyOwner payable {
        emit Status("Owner has deposited some money!", msg.sender, msg.value, true);
    }

    function withdrawFunds(uint amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance in contract");
        payable(owner).transfer(amount);
        emit Status("Owner withdrew some money!", msg.sender, amount, true);
    }

    function setMaxAmountToBet(uint amount) external onlyOwner returns (uint) {
        MaxAmountToBet = amount;
        return MaxAmountToBet;
    }

    function getMaxAmountToBet() external view returns (uint) {
        return MaxAmountToBet;
    }

    function kill() external onlyOwner {
        emit Status("Contract was killed, contract balance will be sent to the owner!", msg.sender, address(this).balance, true);
        selfdestruct(payable(owner));
    }

    // Function to receive Ether
    receive() external payable {}

    // Fallback function
    fallback() external payable {}
}
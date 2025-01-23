"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CoinFlipAbi from '../../abi/CoinFlip.json'; // Ensure this is the correct path to your updated ABI
import Header from '../../components/Header'; // Adjust the import based on your project structure
import { FaTrophy, FaTimesCircle } from 'react-icons/fa';
import { Card } from '@nextui-org/react';
import MyAlert from './MyAlert'; // Adjust the import based on your file structure

declare global {
  interface Window {
    ethereum: any;
  }
}

const CoinFlipGame: React.FC = () => {
  const [betAmount, setBetAmount] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [resultColor, setResultColor] = useState<'success' | 'warning' | 'danger' | undefined>(undefined);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [maxBetAmount, setMaxBetAmount] = useState<bigint | null>(null);
  const [lastGames, setLastGames] = useState<any[]>([]);

  useEffect(() => {
    const initializeEthers = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const newProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(newProvider);

          await window.ethereum.request({ method: 'eth_requestAccounts' });

          const accounts = await newProvider.send("eth_accounts", []);
          if (accounts.length > 0) {
            const newSigner = newProvider.getSigner(accounts[0]);
            setSigner(await newSigner);

            const newContract = new ethers.Contract(
              '0xD0C7284587945991dc4363633Ac7fDf8AbbB5c15', // Update with your contract address
              CoinFlipAbi,
              await newSigner
            );
            setContract(newContract);

            const maxBet = await newContract.MaxAmountToBet();
            setMaxBetAmount(BigInt(maxBet.toString()));

            const gameCount = await newContract.getGameCount();
            const games = [];

            const gameCountNumber = Number(gameCount);
            for (let i = Math.max(0, gameCountNumber - 10); i < gameCountNumber; i++) {
              const gameEntry = await newContract.getGameEntry(i);
              games.push(gameEntry);
            }
            setLastGames(games.reverse());
          }
        } catch (error) {
          console.error('Initialization Error:', error);
          setResult('Failed to initialize ethers.');
          setResultColor('danger');
        }
      }
    };

    initializeEthers();
  }, []);

  const handleFlip = async () => {
    if (!contract) return;

    const betAmountInEther = ethers.parseEther(betAmount);
    if (betAmountInEther <= BigInt(0) || (maxBetAmount && betAmountInEther > maxBetAmount)) {
      setResult('Bet amount is out of allowed range.');
      setResultColor('warning');
      return;
    }

    try {
      const tx = await contract.Play({
        value: betAmountInEther,
        gasLimit: 300000,
      });
      const receipt = await tx.wait();
      const logs = receipt.logs;
      if (logs.length > 0) {
        const log = logs[0];
        const parsedLog = contract.interface.parseLog(log);
        if (parsedLog) {
          const { _msg, user, amount, winner } = parsedLog.args;
          if (winner) {
            setResult(`Congratulations, you win! Winnings: ${ethers.formatEther(amount)} MINTME.`);
            setResultColor('success');
          } else {
            setResult(`Sorry, you lose. Bet Amount: ${ethers.formatEther(amount)} MINTME.`);
            setResultColor('danger');
          }
        } else {
          setResult('Parsed log is null.');
          setResultColor('danger');
        }

        const gameCount = await contract.getGameCount();
        const games = [];

        const gameCountNumber = Number(gameCount);
        for (let i = Math.max(0, gameCountNumber - 10); i < gameCountNumber; i++) {
          const gameEntry = await contract.getGameEntry(i);
          games.push(gameEntry);
        }
        setLastGames(games.reverse());
      } else {
        setResult('Transaction completed but no logs found.');
        setResultColor('danger');
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Transaction Error:', error);
        setResult(`Transaction failed: ${error.message}`);
        setResultColor('danger');
      } else {
        setResult('Transaction failed due to an unknown error.');
        setResultColor('danger');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-sans relative">
      <header className="w-full">
        <Header />
      </header>
      <main className="flex flex-col items-center py-12 px-4 sm:max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-8 drop-shadow-lg text-center">Coin Flip Game</h1>
        <div className="flex flex-col md:flex-row justify-between w-full">
          <div className="w-full md:w-1/3 mx-auto md:mx-0 md:mr-4">
            <h2 className="text-3xl font-bold mb-4 text-center">Place Your Bet</h2>
            <div className="bg-white text-black rounded-md shadow-md p-6 mb-8">
              <label className="block mb-2 text-lg font-semibold text-center">Bet Amount (MINTME):</label>
              <input
                type="text"
                className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
              />
              <button
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition duration-300 transform hover:scale-105"
                onClick={handleFlip}
              >
                Flip Coin
              </button>
              {maxBetAmount && <p className="mt-2 text-lg text-center">Maximum Bet Amount: {ethers.formatEther(maxBetAmount)} MINTME</p>}
            </div>
            <Card className="bg-white text-black rounded-md shadow-md p-6 mb-8">
              <h3 className="text-2xl font-bold mb-2">Game Description</h3>
              <p>
                Welcome to the Coin Flip Game! Place your bet in MINTME and flip the coin. If you win, you'll receive 150% your bet amount. If you lose, you lose your bet amount. Good luck!
              </p>
            </Card>
          </div>

          <div className="w-full md:w-2/3 mx-auto md:mx-0">
            <h2 className="text-3xl font-bold mb-4 text-center">Last Ten Games</h2>
            <div className="w-full overflow-x-auto">
              <table className="w-full bg-white text-black rounded-lg overflow-hidden shadow-lg text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-2 bg-gray-800 text-white">Address</th>
                    <th className="px-2 py-2 bg-gray-800 text-white">Block Number</th>
                    <th className="px-2 py-2 bg-gray-800 text-white">Timestamp</th>
                    <th className="px-2 py-2 bg-gray-800 text-white">Bet Amount</th>
                    <th className="px-2 py-2 bg-gray-800 text-white">Prize</th>
                    <th className="px-2 py-2 bg-gray-800 text-white">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {lastGames.map((game, index) => (
                    <tr key={index} className={`hover:bg-gray-200 ${game.winner ? "bg-green-100" : "bg-red-100"}`}>
                      <td className="px-2 py-2 border text-center break-words">{game.addr}</td>
                      <td className="px-2 py-2 border text-center">{game.blocknumber.toString()}</td>
                      <td className="px-2 py-2 border text-center">{new Date(Number(game.blocktimestamp) * 1000).toLocaleString()}</td>
                      <td className="px-2 py-2 border text-center">{ethers.formatEther(game.bet)}</td>
                      <td className="px-2 py-2 border text-center">{ethers.formatEther(game.prize)}</td>
                      <td className="px-2 py-2 border text-center">
                        {game.winner ? <FaTrophy className="text-green-600 mx-auto" /> : <FaTimesCircle className="text-red-600 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {result && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-auto">
            <MyAlert
              title="Result"
              description={result}
              color={resultColor}
              isVisible={!!result}
              isClosable
              onClose={() => setResult('')}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default CoinFlipGame;
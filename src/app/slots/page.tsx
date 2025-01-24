"use client";

import { useState, useEffect } from 'react';
import { ethers, formatUnits, parseUnits } from 'ethers';
import { Button, Card, Spacer } from '@nextui-org/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faSpinner, faGem, faStar, faHeart, faTrophy, faTimesCircle, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import slotAbi from '../../abi/Slots.json';
import erc20Abi from '../../abi/ERC20.json';
import Header from '../../components/Header';
import MyAlert from './MyAlert'; // Adjust the import based on your file structure

const SLOT_CONTRACT_ADDRESS = '0x8D342583bCD90d725528be03A1b6BBD4A8310faE';
const TOKEN_CONTRACT_ADDRESS = '0x5fed7eb4b29e9b2e2758ac40c9ec4b4e67098192';

const betAmounts = ['1', '5', '10', '25', '50', '100'];
const symbols: IconDefinition[] = [faGem, faStar, faHeart];

interface Game {
  addr: string;
  blocknumber: number;
  blocktimestamp: number;
  bet: string;
  prize: string;
  winner: boolean;
}

const SlotMachinePage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultColor, setResultColor] = useState<'success' | 'warning' | 'danger' | undefined>(undefined);
  const [betAmount, setBetAmount] = useState<string>("1");
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [slotContract, setSlotContract] = useState<ethers.Contract | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [slotSymbols, setSlotSymbols] = useState<IconDefinition[]>([faGem, faStar, faHeart]);
  const [lastGames, setLastGames] = useState<Game[]>([]);

  useEffect(() => {
    const initializeEthers = async () => {
      if ((window as any).ethereum) {
        const tempProvider = new ethers.BrowserProvider((window as any).ethereum);
        const tempSigner = await tempProvider.getSigner();
        const tempSlotContract = new ethers.Contract(SLOT_CONTRACT_ADDRESS, slotAbi, tempSigner);
        const tempTokenContract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, erc20Abi, tempSigner);

        setProvider(tempProvider);
        setSigner(tempSigner);
        setSlotContract(tempSlotContract);
        setTokenContract(tempTokenContract);
      }
    };

    initializeEthers();
  }, []);

  useEffect(() => {
    const fetchLastGames = async () => {
      if (slotContract) {
        const gameCount = await slotContract.getGameCount();
        const gameCountNumber = Number(gameCount);
        const games: Game[] = [];
        const fetchCount = Math.min(gameCountNumber, 10);
        for (let i = 0; i < fetchCount; i++) {
          const game = await slotContract.getGameEntry(gameCount - 1n - BigInt(i));
          games.push({
            addr: game.addr,
            blocknumber: Number(game.blocknumber),
            blocktimestamp: Number(game.blocktimestamp),
            bet: formatUnits(game.bet, 12),
            prize: formatUnits(game.prize, 12),
            winner: game.winner,
          });
        }

        setLastGames(games);
      }
    };

    fetchLastGames();
  }, [slotContract]);

  const handleSpin = async () => {
    setLoading(true);
    setResult(null);
    setSlotSymbols([faSpinner, faSpinner, faSpinner]);

    try {
      if (slotContract && signer && tokenContract) {
        const betAmountInWei = parseUnits(betAmount, 12);

        // Approve the slot contract to spend the token
        const approveTx = await tokenContract.approve(SLOT_CONTRACT_ADDRESS, betAmountInWei);
        await approveTx.wait();

        // Try to send the transaction and catch any errors
        try {
          const tx = await slotContract.spin(betAmountInWei); // Only pass betAmountInWei
          const receipt = await tx.wait();

          const event = receipt.events?.filter((x: any) => x.event === 'Spin')[0];
          const won = event?.args?.[3];
          let newSymbols: IconDefinition[];

          if (won) {
            // Win: All three symbols should be the same
            const winningSymbol = getRandomSymbol();
            newSymbols = [winningSymbol, winningSymbol, winningSymbol];
          } else {
            // Loss: Ensure all three symbols are different
            newSymbols = getUniqueSymbols();
          }

          // Update the symbols first to avoid state issues
          setSlotSymbols(newSymbols);

          // Fetch updated last games after spinning
          const gameCount = await slotContract.getGameCount();
          const newGame = await slotContract.getGameEntry(gameCount - 1n);
          setLastGames((prevGames) => [
            {
              addr: newGame.addr,
              blocknumber: Number(newGame.blocknumber),
              blocktimestamp: Number(newGame.blocktimestamp),
              bet: formatUnits(newGame.bet, 12),
              prize: formatUnits(newGame.prize, 12),
              winner: newGame.winner,
            },
            ...prevGames.slice(0, 9),
          ]);

          // Then update the result message and color based on the latest game
          const latestGame = {
            addr: newGame.addr,
            blocknumber: Number(newGame.blocknumber),
            blocktimestamp: Number(newGame.blocktimestamp),
            bet: formatUnits(newGame.bet, 12),
            prize: formatUnits(newGame.prize, 12),
            winner: newGame.winner,
          };

          setResult(latestGame.winner ? 'You won!' : 'You lost!');
          setResultColor(latestGame.winner ? 'success' : 'danger');
        } catch (error: any) {
          console.error('Error during transaction:', error);
          setResult('Transaction failed');
          setResultColor('danger');
        }
      }
    } catch (error) {
      console.error('Error spinning the slot machine:', error);
      setResult('Error');
      setResultColor('danger');
    } finally {
      setLoading(false);
    }
  };

  const getRandomSymbol = (): IconDefinition => {
    return symbols[Math.floor(Math.random() * symbols.length)];
  };

  const getUniqueSymbols = (): IconDefinition[] => {
    let uniqueSymbols = [...symbols];

    // Ensure we have unique symbols by shuffling and then selecting the first three
    for (let i = uniqueSymbols.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniqueSymbols[i], uniqueSymbols[j]] = [uniqueSymbols[j], uniqueSymbols[i]];
    }
    return uniqueSymbols.slice(0, 3);
  };

  const spinningIcons = () => {
    const interval = setInterval(() => {
      setSlotSymbols([getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]);
    }, 100);
    return interval;
  };

  useEffect(() => {
    if (loading) {
      const interval = spinningIcons();
      return () => clearInterval(interval); // Clear interval when component unmounts or loading changes
    }
  }, [loading]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-sans relative">
      <header className="w-full">
        <Header />
      </header>
      <main className="flex flex-col items-center py-12 px-4 sm:max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-8 drop-shadow-lg text-center">Slot Machine Game</h1>
        <div className="flex flex-col lg:flex-row justify-between w-full">
          <div className="w-full lg:w-1/3 mx-auto lg:mx-0 lg:mr-4">
            <h2 className="text-3xl font-bold mb-4 text-center">Place Your Bet</h2>
            <div className="bg-white text-black rounded-md shadow-md p-6 mb-8">
              <label className="block mb-2 text-lg font-semibold text-center">Bet Amount (RANGER):</label>
              <div className="flex justify-center mb-4 space-x-2">
                {betAmounts.map((amount) => (
                  <Button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    className={`px-4 py-2 rounded ${betAmount === amount ? 'bg-yellow-500 text-black' : 'bg-gray-200 text-black'}`}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
              <div className="flex justify-center items-center mb-4 space-x-4 text-6xl bg-white text-black rounded-lg p-4 shadow-lg">
                {slotSymbols && slotSymbols.map((symbol, index) => (
                  <div key={index} className="flex justify-center items-center mx-2">
                    <FontAwesomeIcon
                      icon={symbol}
                      className="text-yellow-500"
                    />
                  </div>
                ))}
              </div>
              <button
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition duration-300 transform hover:scale-105"
                onClick={handleSpin}
                disabled={loading}
              >
                {loading ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPlay} className="mr-2" />
                    Spin
                  </>
                )}
              </button>
            </div>
            <Card className="bg-white text-black rounded-md shadow-md p-6 mb-8">
              <h3 className="text-2xl font-bold mb-2">Game Description</h3>
              <p>
                Welcome to the Slot Machine game! Select your bet amount by clicking one of the buttons above. 
                Once you have selected your bet, click the Spin button to try your luck. If you match the symbols, you win double your tokens! 
                The result will be displayed below the Spin button. Good luck!
              </p>
            </Card>
          </div>

          <div className="w-full lg:w-2/3 mx-auto lg:mx-0">
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
                      <td className="px-2 py-2 border text-center">{game.blocknumber}</td>
                      <td className="px-2 py-2 border text-center">{new Date(Number(game.blocktimestamp) * 1000).toLocaleString()}</td>
                      <td className="px-2 py-2 border text-center">{game.bet}</td>
                      <td className="px-2 py-2 border text-center">{game.prize}</td>
                      <td className="px-2 py-2 border text-center">
                        {game.winner ? <FontAwesomeIcon icon={faTrophy} className="text-green-600 mx-auto" /> : <FontAwesomeIcon icon={faTimesCircle} className="text-red-600 mx-auto" />}
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

export default SlotMachinePage;
"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button, Card, Spacer } from '@nextui-org/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExchangeAlt, faArrowDown, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import swapContractAbi from '../../abi/SwapContract.json'; // Import the Swap Contract ABI
import erc20Abi from '../../abi/ERC20.json'; // Import the correct ERC-20 ABI
import Header from '../../components/Header'; // Adjust the import based on your project structure

const SWAP_CONTRACT_ADDRESS = '0x2FD24cd741dA1789A4827a0AA8549145708c1B34';
const TOKEN_CONTRACT_ADDRESS = '0x5fed7eb4b29e9b2e2758ac40c9ec4b4e67098192';
const RANGER_DECIMALS = 12; // RANGER has 12 decimals

const SwapPage = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [swapContract, setSwapContract] = useState<ethers.Contract | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [inputAmount, setInputAmount] = useState<string>('');
  const [outputAmount, setOutputAmount] = useState<string>('');
  const [rangerAmount, setRangerAmount] = useState<string>('');
  const [mintMeAmount, setMintMeAmount] = useState<string>('');
  const [swapLoading, setSwapLoading] = useState<boolean>(false);
  const [isTokenToETH, setIsTokenToETH] = useState<boolean>(true);
  const [liquidityLoading, setLiquidityLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('swap');

  useEffect(() => {
    const initializeEthers = async () => {
      if ((window as any).ethereum) {
        const tempProvider = new ethers.BrowserProvider((window as any).ethereum);
        const tempSigner = await tempProvider.getSigner();
        const tempSwapContract = new ethers.Contract(SWAP_CONTRACT_ADDRESS, swapContractAbi, tempSigner);
        const tempTokenContract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, erc20Abi, tempSigner);

        setProvider(tempProvider);
        setSigner(tempSigner);
        setSwapContract(tempSwapContract);
        setTokenContract(tempTokenContract);
      }
    };

    initializeEthers();
  }, []);

  const handleAddLiquidity = async () => {
    setLiquidityLoading(true);

    try {
      if (swapContract && tokenContract && signer) {
        const rangerValue = ethers.parseUnits(rangerAmount, RANGER_DECIMALS); // Convert the input amount to Wei
        const mintMeValue = ethers.parseEther(mintMeAmount); // Convert the input amount to Wei

        // Approve the swap contract to spend RANGER tokens
        const approveTx = await tokenContract.approve(SWAP_CONTRACT_ADDRESS, rangerValue);
        await approveTx.wait();

        // Add liquidity
        const addLiquidityTx = await swapContract.addLiquidity(rangerValue, { value: mintMeValue });
        await addLiquidityTx.wait();

        alert('Liquidity added successfully!');
      }
    } catch (error) {
      console.error('Error adding liquidity:', error);
    } finally {
      setLiquidityLoading(false);
    }
  };

  const handleSwap = async () => {
    setSwapLoading(true);

    try {
      if (swapContract && signer) {
        const amount = ethers.parseUnits(inputAmount, isTokenToETH ? RANGER_DECIMALS : 18); // Convert the input amount to Wei

        if (isTokenToETH) {
          // Swap ERC-20 to ETH
          console.log('Swapping RANGER to MintMe:', amount.toString());
          await swapContract.swapRangerToMintMe(amount);
        } else {
          // Swap ETH to ERC-20
          console.log('Swapping MintMe to RANGER:', amount.toString());
          await swapContract.swapMintMeToRanger(amount, { value: amount });
        }

        // Temporary delay to simulate transaction
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate output amount calculation
        const simulatedOutput = isTokenToETH ? (parseFloat(inputAmount) * 0.95).toString() : (parseFloat(inputAmount) * 1.05).toString();
        setOutputAmount(simulatedOutput);
      }
    } catch (error) {
      console.error('Error performing the swap:', error);
    } finally {
      setSwapLoading(false);
    }
  };

  const handleSwitch = () => {
    setIsTokenToETH(!isTokenToETH);
    setInputAmount('');
    setOutputAmount('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-sans flex flex-col">
      {/* Ensure the Header component is sticky at the top */}
      <div className="sticky top-0 w-full bg-white shadow-md z-10">
        <Header />
      </div>
      <div className="flex-grow flex items-center justify-center">
        <Card className="w-full max-w-lg p-6 bg-white rounded-lg shadow-md text-gray-800">
          <div className="flex justify-around mb-4">
            <Button
              className={`px-4 py-2 ${activeTab === 'swap' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setActiveTab('swap')}
            >
              Swap
            </Button>
            <Button
              className={`px-4 py-2 ${activeTab === 'liquidity' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setActiveTab('liquidity')}
            >
              Liquidity
            </Button>
          </div>

          {activeTab === 'swap' && (
            <>
              <Spacer y={2} />
              <h2 className="text-center mb-4 text-3xl font-bold">🔄 Token Swap 🔄</h2>
              <div className="flex flex-col items-center mb-4">
                <div className="flex flex-col w-full mb-4">
                  <label className="mb-2 font-bold text-lg">{isTokenToETH ? 'RANGER' : 'MintMe'}</label>
                  <div className="relative w-full">
                    <input
                      value={inputAmount}
                      onChange={(e) => setInputAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ fontSize: '1.25rem' }}
                    />
                  </div>
                  <span className="text-sm text-gray-500">{isTokenToETH ? 'RANGER' : 'MintMe'}</span>
                </div>
                <Button
                  onClick={handleSwitch}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-full mb-4"
                >
                  <FontAwesomeIcon icon={faArrowDown} size="lg" />
                </Button>
                <div className="flex flex-col w-full">
                  <label className="mb-2 font-bold text-lg">{isTokenToETH ? 'MintMe' : 'RANGER'}</label>
                  <div className="relative w-full">
                    <input
                      value={outputAmount}
                      placeholder="Output amount"
                      className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ fontSize: '1.25rem' }}
                      disabled
                    />
                  </div>
                  <span className="text-sm text-gray-500">{isTokenToETH ? 'MintMe' : 'RANGER'}</span>
                </div>
                <Button
                  onClick={handleSwap}
                  disabled={swapLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-24 rounded-lg shadow-md mt-4 w-full flex items-center justify-center"
                  style={{ fontSize: '1.5rem' }}
                >
                  {swapLoading ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faExchangeAlt} className="mr-2" />
                      Swap
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {activeTab === 'liquidity' && (
            <>
              <Spacer y={2} />
              <h2 className="text-center mb-4 text-3xl font-bold">💧 Add Liquidity 💧</h2>
              <div className="flex flex-col items-center mb-4">
                <div className="flex flex-col w-full mb-4">
                  <label className="mb-2 font-bold text-lg">Amount of RANGER</label>
                  <div className="relative w-full">
                    <input
                      value={rangerAmount}
                      onChange={(e) => setRangerAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ fontSize: '1.25rem' }}
                    />
                  </div>
                  <span className="text-sm text-gray-500">RANGER</span>
                </div>
                <div className="flex flex-col w-full mb-4">
                  <label className="mb-2 font-bold text-lg">Amount of MintMe (ETH)</label>
                  <div className="relative w-full">
                    <input
                      value={mintMeAmount}
                      onChange={(e) => setMintMeAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ fontSize: '1.25rem' }}
                    />
                  </div>
                  <span className="text-sm text-gray-500">MintMe (ETH)</span>
                </div>
                <Button
                  onClick={handleAddLiquidity}
                  disabled={liquidityLoading}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-24 rounded-lg shadow-md mt-4 w-full flex items-center justify-center"
                  style={{ fontSize: '1.5rem' }}
                >
                  {liquidityLoading ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPlusCircle} className="mr-2" />
                      Add Liquidity
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SwapPage;
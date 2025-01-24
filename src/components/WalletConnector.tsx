"use client"

import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum: any;
  }
}

const truncateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(address.length - 4)}`;
};

const WalletConnector: React.FC = () => {
  const [active, setActive] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<string | null>(null);

  const correctNetworkId = '0x609E'; // Chain ID for MINTME network in hexadecimal
  const tokenContractAddress = '0x5fed7eb4b29e9b2e2758ac40c9ec4b4e67098192';

  const erc20Abi = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
  ];

  useEffect(() => {
    const savedAccount = localStorage.getItem('account');
    const savedNetwork = localStorage.getItem('network');
    if (savedAccount) {
      setAccount(savedAccount);
      setActive(true);
    }
    if (savedNetwork) {
      setNetwork(savedNetwork);
    }
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      if (active && account) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balance = await provider.getBalance(account);
        setBalance(parseFloat(ethers.formatEther(balance)).toFixed(3)); // Format the balance to Ether with 3 decimals
      }
    };
    fetchBalance();
  }, [active, account]);

  useEffect(() => {
    const checkNetwork = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        setNetwork(network.chainId.toString());
        if (network.chainId.toString() !== parseInt(correctNetworkId, 16).toString()) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: correctNetworkId }],
            });
          } catch (switchError) {
            const error = switchError as { code: number }; // Type assertion
            if (error.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: correctNetworkId,
                      chainName: 'MINTME Network',
                      nativeCurrency: {
                        name: 'MintMe',
                        symbol: 'MINTME',
                        decimals: 18,
                      },
                      rpcUrls: ['https://node.1000x.ch'],
                      blockExplorerUrls: ['https://mintme.com/explorer/'],
                    },
                  ],
                });
              } catch (addError) {
                console.error("Failed to add network:", addError);
              }
            } else {
              console.error("Failed to switch network:", switchError);
            }
          }
        }
      }
    };
    if (account) {
      checkNetwork();
    }
  }, [account]);

  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (active && account) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(tokenContractAddress, erc20Abi, provider);
        const balance = await contract.balanceOf(account);
        const decimals = await contract.decimals();
        const formattedBalance = ethers.formatUnits(balance, decimals);
        setTokenBalance(parseFloat(formattedBalance).toFixed(3)); // Format the token balance with 3 decimals
      }
    };
    fetchTokenBalance();
  }, [active, account]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const network = await provider.getNetwork();
        setAccount(accounts[0]);
        setNetwork(network.chainId.toString());
        setActive(true);
        localStorage.setItem('account', accounts[0]);
        localStorage.setItem('network', network.chainId.toString());
      } catch (error) {
        console.error("Failed to activate wallet:", error);
      }
    } else {
      console.log("MetaMask not installed");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setActive(false);
    setBalance(null);
    setNetwork(null);
    setTokenBalance(null);
    localStorage.removeItem('account');
    localStorage.removeItem('network');
  };

  return (
    <div className="flex items-center space-x-4 text-white">
      {active ? (
        <>
          <div className="bg-gray-800 p-2 rounded text-sm">
            Account: {account ? truncateAddress(account) : ''}
          </div>
          <div className="bg-gray-800 p-2 rounded text-sm">
            Balance: {balance} MINTME
          </div>
          <div className="bg-gray-800 p-2 rounded text-sm flex items-center">
            RANGER: {tokenBalance} <img src="/logo.png" alt="Ranger Token" className="inline-block ml-2 w-4 h-4"/>
          </div>
          <div className="bg-gray-800 p-2 rounded text-sm flex items-center">
            Network: <img src="/mintme.png" alt="MintMe" className="inline-block ml-2 w-4 h-4"/>
          </div>
          <button onClick={disconnectWallet} className="px-4 py-2 bg-red-500 text-white rounded">
            Disconnect
          </button>
        </>
      ) : (
        <>
          <button onClick={connectWallet} className="px-4 py-2 bg-blue-500 text-white rounded">
            Connect MetaMask
          </button>
        </>
      )}
    </div>
  );
};

const App: React.FC = () => (
  <WalletConnector />
);

export default App;
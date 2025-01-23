'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import WalletConnector from './WalletConnector';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@nextui-org/react';

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="flex flex-col md:flex-row justify-between items-center p-6 bg-black text-white shadow-lg">
      <Link href="/" legacyBehavior>
        <a className="flex items-center">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 mr-2" />
          <span className="text-3xl font-extrabold cursor-pointer hover:text-yellow-500 transition duration-300">
            RANGER
          </span>
        </a>
      </Link>
      <nav className="flex flex-col md:flex-row md:items-center md:flex-grow md:ml-6">
        <Link href="/coinflip" legacyBehavior>
          <a className="mr-0 md:mr-6 mb-2 md:mb-0 cursor-pointer text-lg hover:text-yellow-500 transition duration-300">
            Coin Flip
          </a>
        </Link>
        <Dropdown isOpen={isOpen} onOpenChange={setIsOpen}>
          <DropdownTrigger>
            <Button
              variant="bordered"
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
              className="text-lg hover:text-yellow-500 transition duration-300"
            >
              Tokens
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Tokens"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            className="bg-black text-white"
          >
            <DropdownItem key="token1">
              <a
                href="https://www.mintme.com/token/RANGER"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center w-full h-full text-lg px-4 py-2 hover:bg-gray-700 transition duration-300"
              >
                RANGER
              </a>
            </DropdownItem>
            <DropdownItem key="token2">
              <a
                href="https://www.mintme.com/token/RANGER"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center w-full h-full text-lg px-4 py-2 hover:bg-gray-700 transition duration-300"
              >
                RANGER
              </a>
            </DropdownItem>
            <DropdownItem key="token3">
              <a
                href="https://www.mintme.com/token/RANGER"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center w-full h-full text-lg px-4 py-2 hover:bg-gray-700 transition duration-300"
              >
                RANGER
              </a>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </nav>
      <WalletConnector />
    </header>
  );
};

export default Header;
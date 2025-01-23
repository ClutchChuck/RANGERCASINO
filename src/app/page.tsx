import React from 'react';
import Header from '../components/Header';
import 'tailwindcss/tailwind.css';

declare global {
  interface Window {
    ethereum: any; // Ensure the type is consistent with WalletConnector
  }
}

const Home: React.FC = () => {
  return (
    <div className="bg-casino-pattern min-h-screen">
      <Header />
      <main className="relative">
        {/* Hero Section */}
        <section className="h-screen flex flex-col items-center justify-center text-center bg-gradient-to-r from-purple-600 to-red-600 text-white">
          <h1 className="text-6xl font-extrabold mb-4">Welcome to Texas RANGER Casino</h1>
          <p className="text-2xl mb-8 max-w-2xl">
            When Chuck Norris wants to relax, he doesn't. But if he did, he'd be at Texas RANGER Casino. Brace yourself for games so exciting, even Chuck Norris can't roundhouse kick the excitement!
          </p>
          <button className="px-8 py-3 bg-yellow-500 text-black rounded-lg font-bold hover:bg-yellow-600 transition duration-300">
            Join the Action
          </button>
        </section>
      </main>
    </div>
  );
};

export default Home;
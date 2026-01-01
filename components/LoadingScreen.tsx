
import React, { useState, useEffect } from 'react';

const LoadingScreen: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    "Constructing worldview...",
    "Mapping expertise...",
    "Defining mental models...",
    "Crafting personality...",
    "Generating avatar...",
    "Finalizing persona..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-2xl w-full mx-auto px-4 py-12 flex flex-col items-center justify-center h-[60vh]">
      <div className="relative mb-12">
        {/* Pulsing rings */}
        <div className="w-32 h-32 border-4 border-cyan-500/20 rounded-full absolute -inset-4 animate-ping"></div>
        <div className="w-32 h-32 border-4 border-purple-500/20 rounded-full absolute -inset-8 animate-ping" style={{ animationDelay: '1s' }}></div>
        <div className="w-32 h-32 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin glow-cyan"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
        </div>
      </div>
      
      <div className="h-8 overflow-hidden">
        <p className="text-2xl font-mono text-cyan-400 tracking-widest text-center animate-pulse transition-all duration-500">
          {messages[messageIndex]}
        </p>
      </div>
      
      <p className="mt-4 text-slate-500 font-mono text-sm uppercase tracking-tighter opacity-60">
        AI Oracle is synthesizing expertise...
      </p>
    </div>
  );
};

export default LoadingScreen;

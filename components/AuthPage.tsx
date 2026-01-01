
import React, { useState } from 'react';

interface AuthPageProps {
  onAuthSuccess: () => void;
  onGoLanding: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess, onGoLanding }) => {
  const [view, setView] = useState<'signin' | 'signup'>('signin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate successful authentication
    onAuthSuccess();
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full"></div>
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
        {/* Logo Section */}
        <button 
          onClick={onGoLanding}
          className="mx-auto mb-8 flex items-center justify-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-3 h-3 bg-cyan-500 rounded-full glow-cyan"></div>
          <span className="font-mono text-xl font-black tracking-[0.2em] uppercase text-white">EXPERTFORGE</span>
        </button>

        <div className="bg-[#0f172a] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setView('signin')}
              className={`flex-1 py-5 text-xs font-mono uppercase tracking-widest transition-all relative ${
                view === 'signin' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Sign In
              {view === 'signin' && <div className="absolute bottom-0 left-0 w-full h-1 bg-cyan-500 glow-cyan"></div>}
            </button>
            <button
              onClick={() => setView('signup')}
              className={`flex-1 py-5 text-xs font-mono uppercase tracking-widest transition-all relative ${
                view === 'signup' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Sign Up
              {view === 'signup' && <div className="absolute bottom-0 left-0 w-full h-1 bg-cyan-500 glow-cyan"></div>}
            </button>
          </div>

          <div className="p-8 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {view === 'signup' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    className="w-full bg-[#020617] border border-slate-800 rounded-2xl py-4 px-6 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full bg-[#020617] border border-slate-800 rounded-2xl py-4 px-6 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Password</label>
                  {view === 'signin' && (
                    <button type="button" className="text-[10px] font-mono text-cyan-500 hover:text-cyan-400 uppercase tracking-tighter">Forgot password?</button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#020617] border border-slate-800 rounded-2xl py-4 px-6 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-cyan-900/20 transform hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {view === 'signin' ? 'Sign In' : 'Create Account'}
              </button>

              <div className="relative py-4 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-800"></div>
                <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">or continue with</span>
                <div className="h-px flex-1 bg-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={onAuthSuccess}
                className="w-full bg-slate-900 border border-slate-800 text-slate-300 font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
            </form>

            <p className="text-center mt-8 text-xs text-slate-500">
              {view === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button onClick={() => setView('signup')} className="text-cyan-500 font-bold hover:underline">Sign up</button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button onClick={() => setView('signin')} className="text-cyan-500 font-bold hover:underline">Sign in</button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

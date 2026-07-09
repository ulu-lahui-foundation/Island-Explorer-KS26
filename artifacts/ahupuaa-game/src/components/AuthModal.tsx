import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

interface Props {
  onSuccess: () => void;
}

export function AuthModal({ onSuccess }: Props) {
  const { signIn, createAccount } = useAuth();
  const [tab, setTab] = useState<'signin' | 'create'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = tab === 'signin'
      ? signIn(username, password)
      : createAccount(username, password);

    setLoading(false);

    if (result.ok) {
      onSuccess();
    } else {
      setError(result.error ?? 'Something went wrong.');
    }
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.07)',
    border: '1.5px solid rgba(246,241,231,0.18)',
    borderRadius: 14,
    color: '#F6F1E7',
    padding: '14px 16px',
    fontSize: 15,
    width: '100%',
    outline: 'none',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      style={{ background: 'rgba(10,20,15,0.82)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        className="w-full max-w-[360px] mx-4 rounded-[28px] overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #1a3d2b 0%, #152e20 100%)',
          border: '1.5px solid rgba(123,201,111,0.20)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center pt-10 pb-6 px-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(47,111,78,0.35)', border: '2px solid rgba(123,201,111,0.25)' }}
          >
            <Leaf size={32} style={{ color: '#7BC96F' }} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#F6F1E7' }}>
            Ahupuaʻa Explorer
          </h1>
          <p className="text-sm mt-1 font-medium" style={{ color: 'rgba(246,241,231,0.50)' }}>
            Sign in to save your progress
          </p>
        </div>

        {/* Tab switcher */}
        <div
          className="mx-6 flex rounded-2xl p-1 mb-6"
          style={{ background: 'rgba(0,0,0,0.25)' }}
        >
          {(['signin', 'create'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: tab === t ? 'rgba(47,111,78,0.75)' : 'transparent',
                color: tab === t ? '#F6F1E7' : 'rgba(246,241,231,0.40)',
              }}
            >
              {t === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-8 flex flex-col gap-3">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            style={inputStyle}
          />

          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
              style={{ ...inputStyle, paddingRight: 48 }}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
              style={{ color: 'rgba(246,241,231,0.40)' }}
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm font-semibold text-center"
                style={{ color: '#f87171' }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading || !username || !password}
            whileTap={{ scale: 0.96 }}
            className="mt-1 w-full py-4 rounded-2xl text-base font-extrabold transition-opacity"
            style={{
              background: 'linear-gradient(135deg, #2F6F4E 0%, #3d9464 100%)',
              color: '#F6F1E7',
              opacity: (!username || !password) ? 0.45 : 1,
              boxShadow: '0 4px 20px rgba(47,111,78,0.40)',
            }}
          >
            {loading ? '…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
          </motion.button>

          {tab === 'signin' && (
            <p className="text-center text-xs mt-1" style={{ color: 'rgba(246,241,231,0.30)' }}>
              Try a test account below in the Piko tab
            </p>
          )}
        </form>
      </motion.div>
    </motion.div>
  );
}

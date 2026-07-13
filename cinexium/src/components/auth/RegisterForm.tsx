'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';

export const RegisterForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    country: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<Array<{name: string, cca2: string}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedCountry] = useDebounce(formData.country, 500);
  const [debouncedUsername] = useDebounce(formData.username, 500);
  const [usernameStatus, setUsernameStatus] = useState<{checking: boolean, available: boolean | null, suggestion?: string}>({ checking: false, available: null });

  React.useEffect(() => {
    fetch('/countries.json')
      .then(res => res.json())
      .then(data => setCountriesList(data))
      .catch(console.error);
  }, []);

  React.useEffect(() => {
    if (!debouncedCountry || debouncedCountry.length < 2) {
      setSuggestions([]);
      return;
    }

    const query = debouncedCountry.toLowerCase();
    
    const levenshtein = (a: string, b: string) => {
      const matrix = [];
      let i, j;
      for (i = 0; i <= b.length; i++) matrix[i] = [i];
      for (j = 0; j <= a.length; j++) matrix[0][j] = j;
      for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
          }
        }
      }
      return matrix[b.length][a.length];
    };

    const matches = countriesList.map(c => {
       let bestScore = Infinity;
       
       const terms = [
         c.name.common.toLowerCase(), 
         c.name.official.toLowerCase(), 
         ...(c.altSpellings || []).map((a: string) => a.toLowerCase())
       ];
       
       for (const term of terms) {
         if (term === query) { bestScore = 0; break; }
         if (term.includes(query) || query.includes(term)) {
           bestScore = Math.min(bestScore, Math.abs(term.length - query.length) * 0.5); // Favor substring matches
         } else {
           const dist = levenshtein(query, term);
           bestScore = Math.min(bestScore, dist);
         }
       }
       return { name: c.name.common, cca2: c.cca2, score: bestScore };
    });
    
    matches.sort((a, b) => a.score - b.score);
    const top = matches.filter(m => m.score <= 4).slice(0, 5).map(m => ({ name: m.name, cca2: m.cca2 }));
    
    if (top.length === 1 && top[0].name.toLowerCase() === query) {
      setSuggestions([]);
    } else {
      setSuggestions(top);
    }
  }, [debouncedCountry, countriesList]);

  React.useEffect(() => {
    if (!debouncedUsername) {
      setUsernameStatus({ checking: false, available: null });
      return;
    }

    const checkUsername = async () => {
      setUsernameStatus(prev => ({ ...prev, checking: true }));
      try {
        const res = await fetch(`/api/user/check-username?username=${encodeURIComponent(debouncedUsername)}`);
        const data = await res.json();
        setUsernameStatus({
          checking: false,
          available: data.available,
          suggestion: data.suggestion
        });
      } catch (err) {
        setUsernameStatus({ checking: false, available: null });
      }
    };

    checkUsername();
  }, [debouncedUsername]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (usernameStatus.available === false) {
      setError('Please choose an available username.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, action: 'signup' }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      // Redirect to OTP page with signup context
      const query = new URLSearchParams({
        email: data.email,
        name: formData.name,
        username: formData.username,
        country: formData.country,
        action: 'signup'
      }).toString();
      
      router.push(`/verify-otp?${query}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-[#0f1115]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl relative z-20 max-h-full overflow-y-auto scrollbar-hide">
      <div className="text-center mb-8">
        <Link href="/" className="inline-block mb-4">
          <span className="text-3xl font-bold text-primary-500 tracking-wider">CINEXIUM</span>
        </Link>
        <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
        <p className="text-gray-400 text-sm">Join the ultimate streaming experience</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-white/5 border rounded-xl placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                usernameStatus.available === false 
                  ? 'border-red-500 text-red-500 focus:ring-red-500' 
                  : 'border-white/10 text-white focus:ring-primary-500'
              }`}
              placeholder="johndoe"
            />
            {usernameStatus.available === false && (
              <p className="mt-1 text-xs text-red-500">
                Already taken. Try:{' '}
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, username: usernameStatus.suggestion! }))}
                  className="font-bold underline hover:text-red-400"
                >
                  {usernameStatus.suggestion}
                </button>
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            placeholder="john@example.com"
          />
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-300 mb-1">Country</label>
          <div className="relative">
            <input
              type="text"
              name="country"
              required
              value={formData.country}
              onChange={(e) => {
                handleChange(e);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full pl-4 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              placeholder="United States"
              autoComplete="off"
            />
            {(() => {
              const selectedObj = countriesList.find(c => c.name.common.toLowerCase() === formData.country.toLowerCase());
              return selectedObj?.cca2 ? (
                <img 
                  src={`https://flagcdn.com/w40/${selectedObj.cca2.toLowerCase()}.png`} 
                  alt={selectedObj.name.common}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 rounded-sm drop-shadow-md pointer-events-none select-none"
                />
              ) : null;
            })()}
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-[#1a1d24] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent blur
                    setFormData(prev => ({ ...prev, country: sug.name }));
                    setShowSuggestions(false);
                  }}
                  className="w-full flex items-center gap-3 text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 last:border-0"
                >
                  <img src={`https://flagcdn.com/w40/${sug.cca2.toLowerCase()}.png`} alt={`${sug.name} flag`} className="w-6 rounded-sm drop-shadow-sm" />
                  <span>{sug.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 mt-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending Code...' : 'Send Signup Code'}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between">
        <div className="h-px bg-white/10 w-full" />
        <span className="px-4 text-xs text-gray-500 uppercase tracking-wider">OR</span>
        <div className="h-px bg-white/10 w-full" />
      </div>

      <div className="mt-6">
        <button 
          onClick={() => signIn('google', { callbackUrl: '/premium' })}
          className="w-full flex items-center justify-center gap-3 py-3 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-semibold transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign up with Google
        </button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-400 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-500 hover:text-primary-400 font-semibold transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

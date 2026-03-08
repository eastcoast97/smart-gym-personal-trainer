'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#12121a] rounded-2xl border border-[#1a1a24] p-8">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Sign In</h1>
          
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-[#1a1a24] border border-[#2a2a34] text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-[#1a1a24] border border-[#2a2a34] text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-zinc-500">
            Don&apos;t have an account?{' '}
            <a href="/register" className="text-sky-400 hover:text-sky-300">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#12121a] rounded-2xl border border-[#1a1a24] p-8">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Create Account</h1>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-4 py-3 rounded-lg bg-[#1a1a24] border border-[#2a2a34] text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="w-full px-4 py-3 rounded-lg bg-[#1a1a24] border border-[#2a2a34] text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Password</label>
              <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={8} className="w-full px-4 py-3 rounded-lg bg-[#1a1a24] border border-[#2a2a34] text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50" placeholder="Min 8 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Confirm Password</label>
              <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required className="w-full px-4 py-3 rounded-lg bg-[#1a1a24] border border-[#2a2a34] text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50" placeholder="Confirm password" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 transition-colors disabled:opacity-50">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <a href="/login" className="text-sky-400 hover:text-sky-300">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}

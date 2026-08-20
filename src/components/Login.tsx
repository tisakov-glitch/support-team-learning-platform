/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Globe, Sparkles } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  openEmailSimulator?: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка входа');
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen flex flex-col items-center justify-between p-4 md:p-8 bg-[#E1DEDB] text-[#0F172A] relative overflow-hidden selection:bg-[#C9B87A] selection:text-[#0F172A]">
      {/* Retmind Brand Background Geometry */}
      <div className="absolute inset-0 pointer-events-none select-none opacity-40">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#C9B87A]/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#C9B87A]/15 to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#C9B87A_1px,transparent_1px)] [background-size:32px_32px] opacity-20" />
      </div>

      {/* Top Header Navigation Bar */}
      <header className="w-full max-w-6xl flex items-center justify-between z-10 py-4 border-b border-[#C9B87A]/30">
        <div className="flex items-center gap-3">
          {/* Retmind SVG Logo Lockup */}
          <div className="flex items-center gap-2.5">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <rect x="2" y="2" width="32" height="32" rx="6" fill="#0F172A" />
              <path d="M12 10H24V14H12V10Z" fill="#C9B87A" />
              <path d="M12 16H24V20H12V16Z" fill="#E1DEDB" fillOpacity="0.8" />
              <path d="M12 22H18V26H12V22Z" fill="#C9B87A" />
              <circle cx="23" cy="24" r="2" fill="#C9B87A" />
            </svg>
            <div>
              <span className="text-lg font-black uppercase tracking-[0.2em] text-[#0F172A] block leading-none">
                RETMIND
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#A08C4A] block mt-0.5">
                Senior IT & Retail Solutions
              </span>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#0F172A]/70">
          <span className="flex items-center gap-1.5 bg-[#F5EFD7] px-3 py-1.5 rounded-full border border-[#C9B87A]/40 text-[#0F172A]">
            <Globe className="w-3.5 h-3.5 text-[#A08C4A]" />
            <span>Support & Learning Academy</span>
          </span>
        </div>
      </header>

      {/* Main Login Card Section */}
      <main className="w-full max-w-md my-auto z-10 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-white border border-[#C9B87A]/40 rounded-3xl shadow-2xl shadow-[#0F172A]/10 overflow-hidden"
        >
          {/* Card Gold Accent Line */}
          <div className="h-1.5 bg-gradient-to-r from-[#C9B87A] via-[#0F172A] to-[#C9B87A]" />

          <div className="p-8 sm:p-10">
            {/* Header Title inside card */}
            <div className="text-center mb-8">
              <div className="inline-flex p-3 rounded-2xl bg-[#F5EFD7] text-[#0F172A] mb-3 border border-[#C9B87A]/40 shadow-xs">
                <ShieldCheck className="w-6 h-6 text-[#A08C4A]" />
              </div>
              <h1 className="text-xl font-bold uppercase tracking-[0.12em] text-[#0F172A]">
                Вход в систему
              </h1>
              <p className="text-xs text-[#0F172A]/60 mt-1.5 tracking-wide">
                Единая платформа поддержки и развития персонала Retmind
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-4 rounded-2xl mb-6 flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <p className="font-medium">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#0F172A]/60 mb-2">
                  Корпоративная почта (Email)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#A08C4A]">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="firstname.lastname@retmind.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-[#F7F5F2] border border-[#C9B87A]/40 rounded-2xl text-[#0F172A] placeholder-[#0F172A]/40 focus:outline-none focus:ring-2 focus:ring-[#C9B87A] focus:border-transparent transition-all text-xs font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#0F172A]/60 mb-2">
                  Пароль (Password)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#A08C4A]">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-11 pr-4 py-3.5 bg-[#F7F5F2] border border-[#C9B87A]/40 rounded-2xl text-[#0F172A] placeholder-[#0F172A]/40 focus:outline-none focus:ring-2 focus:ring-[#C9B87A] focus:border-transparent transition-all text-xs font-medium"
                    required
                  />
                </div>
              </div>

              <button
                id="submit-login-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-4 bg-[#0F172A] hover:bg-[#1E293B] active:scale-[0.99] disabled:opacity-50 text-white font-bold rounded-2xl flex items-center justify-center gap-2.5 transition-all cursor-pointer text-xs uppercase tracking-[0.15em] border border-[#C9B87A]/30 shadow-lg shadow-[#0F172A]/20"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Войти в аккаунт</span>
                    <ArrowRight className="w-4 h-4 text-[#C9B87A]" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Clean Card Footer */}
          <div className="border-t border-[#C9B87A]/20 bg-[#F7F5F2]/80 px-8 py-4 text-center">
            <p className="text-[11px] font-medium text-[#0F172A]/60 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#A08C4A]" />
              <span>Стратегия · Процессы · Люди · Данные · Технологии</span>
            </p>
          </div>
        </motion.div>
      </main>

      {/* Retmind Footer */}
      <footer className="w-full max-w-6xl text-center z-10 py-4 border-t border-[#C9B87A]/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-medium text-[#0F172A]/60">
        <div>
          Retmind — Международная компания в области ИТ и консалтинга для розничного бизнеса.
        </div>
        <div className="font-mono text-[10px]">
          © {new Date().getFullYear()} Retmind. Все права защищены.
        </div>
      </footer>
    </div>
  );
}

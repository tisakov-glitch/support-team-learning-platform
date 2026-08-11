/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Mail, Lock, User, CheckCircle2, ArrowRight, HelpCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  openEmailSimulator: () => void;
}

export default function Login({ onLoginSuccess, openEmailSimulator }: LoginProps) {
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

  const handleQuickSelect = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
    setError('');
  };

  return (
    <div id="login-container" className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-slate-800 selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      {/* Decorative background grid and minimalist blurs */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-70 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-200/40 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-white text-indigo-600 mb-4 border border-slate-200 shadow-sm">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">
            Support Learning Platform
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Система обучения и адаптации службы поддержки
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              Авторизация в системе
            </h2>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3.5 rounded-xl mb-6 flex items-start gap-2"
              >
                <div className="text-rose-500 font-bold mt-0.5 font-mono">!</div>
                <p>{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Электронная почта (Email)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@support.edu"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Пароль (Password)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <button
                id="submit-login-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-200 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer text-sm tracking-tight"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Войти в систему
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick login helper block */}
          <div className="border-t border-slate-100 bg-slate-50/50 p-6 space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              Тестовые аккаунты для входа:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <button
                id="quick-admin-login"
                type="button"
                onClick={() => handleQuickSelect('admin@support.edu', 'admin123')}
                className="p-3.5 rounded-xl border border-slate-100 bg-white hover:bg-indigo-50/30 hover:border-indigo-500/40 text-left transition-all flex flex-col justify-between group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 group-hover:text-indigo-700">Администратор</span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[9px] font-bold">Full Access</span>
                </div>
                <div className="mt-1 text-slate-500 font-mono text-[11px] truncate">admin@support.edu</div>
                <div className="text-slate-400 mt-1 font-mono text-[10px]">Pass: admin123</div>
              </button>

              <button
                id="quick-employee-login"
                type="button"
                onClick={() => handleQuickSelect('Dastan.Abitkulov@retmind.com', 'password123')}
                className="p-3.5 rounded-xl border border-slate-100 bg-white hover:bg-indigo-50/30 hover:border-indigo-500/40 text-left transition-all flex flex-col justify-between group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 group-hover:text-indigo-700">Dastan Abitkulov</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold">Specialist L1</span>
                </div>
                <div className="mt-1 text-slate-500 font-mono text-[11px] truncate">Dastan.Abitkulov@retmind.com</div>
                <div className="text-slate-400 mt-1 font-mono text-[10px]">Pass: password123</div>
              </button>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-2xl text-[11px] leading-relaxed text-indigo-700 italic border border-indigo-100/20">
              <p className="font-bold not-italic mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                Тестирование приглашений:
              </p>
              Зайдите как <strong className="text-slate-900 not-italic font-bold">Администратор</strong>, создайте нового сотрудника, и затем откройте <button type="button" onClick={openEmailSimulator} className="underline font-bold text-indigo-650 hover:text-indigo-700">Симулятор писем</button>, чтобы получить ссылку-приглашение для активации нового аккаунта!
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

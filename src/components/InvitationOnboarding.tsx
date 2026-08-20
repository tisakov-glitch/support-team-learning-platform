/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Mail, Lock, User, CheckCircle2, ArrowRight, AlertTriangle, Key } from 'lucide-react';
import { Employee } from '../types';

interface InvitationOnboardingProps {
  token: string;
  onOnboardingComplete: (user: Employee, sessionToken: string) => void;
  onCancel: () => void;
}

export default function InvitationOnboarding({ token, onOnboardingComplete, onCancel }: InvitationOnboardingProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Password registration fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activating, setActivating] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/onboarding/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Срок действия приглашения истек или ссылка недействительна.');
      }

      setEmployee(data.employee);
    } catch (err: any) {
      setError(err.message || 'Ошибка валидации токена');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError('Пароль должен состоять минимум из 6 символов');
      return;
    }
    if (password !== confirmPassword) {
      setError('Введенные пароли не совпадают');
      return;
    }

    setError('');
    setActivating(true);

    try {
      const response = await fetch(`/api/onboarding/${token}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка активации учетной записи');
      }

      setActivationSuccess(true);
      
      // Deliberate small timeout to let them see the success state
      setTimeout(() => {
        onOnboardingComplete(data.user, data.token);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Ошибка активации учетной записи');
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 p-4">
        <span className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-400">Проверка пригласительного токена...</p>
      </div>
    );
  }

  if (error && !employee) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 p-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-35 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-slate-800 border border-slate-700/60 p-6 md:p-8 rounded-2xl shadow-xl text-center space-y-5 z-10"
        >
          <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">Приглашение недействительно</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {error}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onCancel}
              className="w-full py-2 bg-slate-700 hover:bg-slate-650 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Вернуться на экран входа
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-teal-500/10 text-teal-400 mb-4 border border-teal-500/20 shadow-inner">
            <Key className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Активация аккаунта сотрудника
          </h1>
          <p className="text-xs text-slate-400 mt-1.5">
            Установите пароль для завершения регистрации в системе
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700/60 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
          <div className="p-6 md:p-8 space-y-6">
            
            {/* Registered Employee Box */}
            {employee && (
              <div className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-xl flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold font-mono">
                  {employee.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-sm truncate">{employee.name}</h3>
                  <p className="text-slate-400 text-[11px] truncate">{employee.email}</p>
                  <p className="text-[10px] text-teal-400 font-medium mt-0.5">
                    {(employee.positionName || employee.profile?.positionName) ? `${employee.positionName || employee.profile?.positionName} ${(employee.rank || employee.profile?.rank) ? `(${employee.rank || employee.profile?.rank})` : ''}` : 'Служба поддержки'}
                  </p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{employee.department || employee.profile?.department || 'Поддержка'}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-lg flex items-start gap-2">
                <div className="text-rose-500 font-bold font-mono">!</div>
                <p>{error}</p>
              </div>
            )}

            {activationSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 p-5 rounded-xl text-center space-y-2"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-sm text-white">Учетная запись активирована!</h3>
                <p className="text-xs text-slate-300">
                  Вход выполнен успешно. Перенаправление в ваш кабинет...
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleActivate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                    Новый пароль *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      id="onboarding-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Минимум 6 символов"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                    Подтвердите пароль *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      id="onboarding-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Повторите ввод нового пароля"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    id="onboarding-submit-btn"
                    type="submit"
                    disabled={activating}
                    className="w-full py-3 bg-teal-500 hover:bg-teal-400 active:bg-teal-600 disabled:bg-teal-800 text-slate-900 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer text-sm"
                  >
                    {activating ? (
                      <span className="inline-block w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Активировать и войти
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
          
          <div className="border-t border-slate-700/60 bg-slate-850 p-4 text-center">
            <button
              onClick={onCancel}
              className="text-xs text-slate-400 hover:text-white underline transition-colors"
            >
              Отменить активацию и вернуться к входу
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

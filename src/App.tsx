/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Employee, SimulatedEmail } from './types';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import InvitationOnboarding from './components/InvitationOnboarding';
import { Mail, HelpCircle, X, ShieldCheck } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<Employee | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [view, setView] = useState<'login' | 'admin' | 'employee' | 'onboarding'>('login');
  const [onboardingToken, setOnboardingToken] = useState<string>('');
  const [simulatedEmails, setSimulatedEmails] = useState<SimulatedEmail[]>([]);
  const [loading, setLoading] = useState(true);

  // Global inline notifications for email client access
  const [showGlobalEmailFloat, setShowGlobalEmailFloat] = useState(false);
  const [unreadEmailCount, setUnreadEmailCount] = useState(0);

  useEffect(() => {
    // 1. Initial Auth Check
    checkActiveSession();

    // 2. Initial email fetch
    fetchSimulatedEmails();

    // 3. Listen to virtual URL routing (e.g. /onboarding/token)
    handlePathnameRouting();

    // 4. Periodically fetch simulated emails for administrative tracking
    const emailInterval = setInterval(fetchSimulatedEmails, 5000);
    return () => clearInterval(emailInterval);
  }, []);

  const handlePathnameRouting = () => {
    const path = window.location.pathname;
    if (path.startsWith('/onboarding/')) {
      const tokenFromPath = path.replace('/onboarding/', '');
      if (tokenFromPath) {
        setOnboardingToken(tokenFromPath);
        setView('onboarding');
      }
    }
  };

  const checkActiveSession = async () => {
    const savedToken = localStorage.getItem('support_learning_token');
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      });
      const data = await response.json();

      if (response.ok) {
        setUser(data);
        setToken(savedToken);
        setView((data.role === 'admin' || data.role === 'manager') ? 'admin' : 'employee');
      } else {
        localStorage.removeItem('support_learning_token');
      }
    } catch (err) {
      console.error('Session restoration failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimulatedEmails = async () => {
    try {
      const response = await fetch('/api/emails');
      if (response.ok) {
        const data = await response.json();
        setSimulatedEmails(data);
        setUnreadEmailCount(data.filter((e: SimulatedEmail) => e.status === 'sent').length);
      }
    } catch (err) {
      console.warn('Failed to fetch simulated emails:', err);
    }
  };

  const handleLoginSuccess = (loggedInUser: Employee, sessionToken: string) => {
    localStorage.setItem('support_learning_token', sessionToken);
    setUser(loggedInUser);
    setToken(sessionToken);
    setView((loggedInUser.role === 'admin' || loggedInUser.role === 'manager') ? 'admin' : 'employee');
  };

  const handleLogout = () => {
    localStorage.removeItem('support_learning_token');
    setUser(null);
    setToken(null);
    setView('login');
    // Reset URL path if needed
    window.history.pushState({}, '', '/');
  };

  const handleOnboardingComplete = (activatedUser: Employee, sessionToken: string) => {
    // Clear URL path back to root safely
    window.history.pushState({}, '', '/');
    handleLoginSuccess(activatedUser, sessionToken);
  };

  const handleCancelOnboarding = () => {
    window.history.pushState({}, '', '/');
    setView('login');
    setOnboardingToken('');
  };

  const handleTriggerOnboardingFromEmail = (tokenStr: string) => {
    // Navigate virtually to onboarding
    window.history.pushState({}, '', `/onboarding/${tokenStr}`);
    setOnboardingToken(tokenStr);
    setView('onboarding');
    setShowGlobalEmailFloat(false);
  };

  const handleProfileUpdate = (updatedUser: Employee) => {
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-100 p-4 font-sans">
        <span className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Инициализация платформы обучения...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      
      {/* Dynamic View Swapping */}
      <AnimatePresence mode="wait">
        {view === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <Login 
              onLoginSuccess={handleLoginSuccess}
              openEmailSimulator={() => setShowGlobalEmailFloat(true)}
            />
          </motion.div>
        )}

        {view === 'admin' && user && (
          <motion.div
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <AdminDashboard 
              adminUser={user}
              onLogout={handleLogout}
              openEmailFromApp={handleTriggerOnboardingFromEmail}
              simulatedEmails={simulatedEmails}
              refreshEmails={fetchSimulatedEmails}
            />
          </motion.div>
        )}

        {view === 'employee' && user && (
          <motion.div
            key="employee"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <EmployeeDashboard 
              employee={user}
              onLogout={handleLogout}
              onProfileUpdate={handleProfileUpdate}
            />
          </motion.div>
        )}

        {view === 'onboarding' && onboardingToken && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <InvitationOnboarding 
              token={onboardingToken}
              onOnboardingComplete={handleOnboardingComplete}
              onCancel={handleCancelOnboarding}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Interactive Quick Email Check Widget for non-admin panels */}
      {view === 'login' && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            id="floating-email-center-btn"
            onClick={() => setShowGlobalEmailFloat(true)}
            className="p-4 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center relative cursor-pointer group"
          >
            <Mail className="w-5.5 h-5.5" />
            {unreadEmailCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow ring-2 ring-slate-900">
                {unreadEmailCount}
              </span>
            )}
            
            {/* Quick Helper Tooltip */}
            <span className="absolute right-14 bg-slate-800 text-slate-100 text-[10px] font-semibold py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow border border-slate-700 transition-opacity">
              Открыть почтовый симулятор (Письма-приглашения)
            </span>
          </button>
        </div>
      )}

      {/* Global Quick-Check Simulated Mailbox Modal */}
      <AnimatePresence>
        {showGlobalEmailFloat && (
          <div id="mailbox-global-overlay" className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
            >
              <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-teal-400" />
                  <div>
                    <h3 className="font-bold text-sm text-white">Имитатор Почтового Сервера</h3>
                    <p className="text-[10px] text-slate-400">Входящие приглашения сотрудников поддержки</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGlobalEmailFloat(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-2 flex-1 bg-slate-900/60">
                {simulatedEmails.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 space-y-2">
                    <Mail className="w-8 h-8 text-slate-700 mx-auto" />
                    <p className="text-xs">Входящих писем нет</p>
                    <p className="text-[10px] text-slate-600 leading-normal max-w-xs mx-auto">
                      Войдите под администратором (<span className="text-slate-400 font-mono">admin@support.edu</span>) и создайте нового сотрудника, чтобы отправить ему приглашение.
                    </p>
                  </div>
                ) : (
                  simulatedEmails.map((emailObj) => (
                    <div
                      key={emailObj.id}
                      className="p-3 bg-slate-800 border border-slate-750 rounded-xl text-left hover:border-teal-500/40 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-teal-400 truncate max-w-[200px]">{emailObj.to}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(emailObj.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-xs text-white font-medium mt-1 truncate">{emailObj.subject}</div>
                      
                      <div className="mt-2.5 p-2.5 bg-slate-950/65 rounded text-[11px] text-slate-300 font-mono leading-relaxed select-all">
                        Токен приглашения: {emailObj.token}
                      </div>

                      <div className="mt-3 flex gap-2 justify-end">
                        <button
                          id={`accept-invite-sim-btn-${emailObj.token}`}
                          type="button"
                          onClick={() => handleTriggerOnboardingFromEmail(emailObj.token)}
                          className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-900 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Перейти по ссылке из письма
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-slate-950/80 p-3.5 border-t border-slate-800 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Здесь вы можете кликать по ссылкам для симуляции активации писем.</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

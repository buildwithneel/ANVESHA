import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  User,
  Radio,
  Camera,
  Cpu,
  AlertCircle,
  CheckCircle2,
  Info,
  ArrowRight,
  HelpCircle,
  X,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { authService } from '../services/authService';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Form State ──────────────────────────────────────────
  const [employeeId, setEmployeeId] = useState('RLY-10042');
  const [password, setPassword] = useState('officer123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // ── UI States ───────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successUser, setSuccessUser] = useState(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!employeeId.trim()) {
      setErrorMessage('Please enter your Employee ID.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.login(employeeId, password, rememberMe);
      setSuccessUser(result.user);

      // Smooth, professional success transition (250ms)
      setTimeout(() => {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }, 350);
    } catch (err) {
      setErrorMessage(err.message || 'Unable to connect to the service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (empId, pass) => {
    setEmployeeId(empId);
    setPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-12 font-sans selection:bg-blue-600 selection:text-white">
      {/* Background Subtle Structural Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-slate-800/80 bg-slate-900/90 shadow-2xl overflow-hidden backdrop-blur-sm">
        {/* ── Left Brand & Operational Section (5 Cols) ─────── */}
        <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-slate-950/60 border-b lg:border-b-0 lg:border-r border-slate-800/80">
          <div className="space-y-6">
            {/* National Railway Emblems / System Badge */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">
                  INDIAN RAILWAYS
                </span>
                <div className="text-[11px] text-slate-400 font-medium">
                  Ahmedabad Division · Vadodara Station
                </div>
              </div>
            </div>

            {/* Title & Tagline */}
            <div className="space-y-2 pt-2">
              <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">
                RAILGUARD AI
              </h1>
              <p className="text-xs font-medium text-blue-300">
                Railway Intelligent Operations Platform
              </p>
              <p className="text-xs text-slate-400 leading-relaxed font-normal pt-1">
                Unified computer vision surveillance, passenger crowd intelligence, and worksite safety compliance.
              </p>
            </div>

            {/* Quiet Confidence Philosophy */}
            <div className="pt-2 flex items-center gap-3 text-xs text-slate-300 font-medium border-t border-slate-800/60 pt-4">
              <span className="flex items-center gap-1 text-blue-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Monitor
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Understand
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Respond
              </span>
            </div>
          </div>

          {/* Subdued Operational Indicators */}
          <div className="pt-8 space-y-2.5 text-xs border-t border-slate-800/60 mt-6 lg:mt-0">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-2">
                <Camera className="w-3.5 h-3.5 text-slate-400" />
                CCTV Network
              </span>
              <span className="font-mono text-slate-300 font-medium">24 Feeds Monitored</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                AI Inference Engine
              </span>
              <span className="font-mono text-emerald-400 font-medium">ML-Ready Active</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-slate-400" />
                System Status
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Operational
              </span>
            </div>
          </div>
        </div>

        {/* ── Right Sign-In Section (7 Cols) ─────────────────── */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
          <div>
            {/* Header */}
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Welcome back
              </h2>
              <p className="text-xs text-slate-400">
                Sign in with your authorized railway employee credentials
              </p>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div
                role="alert"
                className="mt-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-start gap-2.5 animate-fade-in"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Success Transition */}
            {successUser && (
              <div
                role="status"
                className="mt-4 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2.5 animate-fade-in"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  Welcome back, <strong>{successUser.name}</strong>. Opening Command Console...
                </span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Employee ID */}
              <div className="space-y-1.5">
                <label
                  htmlFor="employee-id"
                  className="block text-xs font-semibold text-slate-300 tracking-wide"
                >
                  Employee ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="employee-id"
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. RLY-10042"
                    autoComplete="username"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-slate-300 tracking-wide"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="w-full pl-9 pr-10 py-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-xs font-sans text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Device Checkbox */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-blue-500/20"
                  />
                  <span>Remember this device</span>
                </label>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading || Boolean(successUser)}
                className={cn(
                  'w-full py-2.5 px-4 rounded-lg text-xs font-bold tracking-wide uppercase transition-all shadow-md flex items-center justify-center gap-2',
                  loading || Boolean(successUser)
                    ? 'bg-blue-600/70 text-white/80 cursor-wait'
                    : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-[0.99]'
                )}
              >
                <span>{loading ? 'Signing you in...' : successUser ? 'Verified' : 'Sign In'}</span>
                {!loading && !successUser && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </form>

            {/* Quick Demo Fill Buttons (For Smooth Testing) */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Demo Quick Access:
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickFill('RLY-10042', 'officer123')}
                  className="px-2.5 py-1 rounded bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-300 transition-colors"
                >
                  Duty Officer (RLY-10042)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('RLY-10001', 'admin123')}
                  className="px-2.5 py-1 rounded bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-[11px] text-purple-300 transition-colors"
                >
                  Station Admin (RLY-10001)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('RLY-10099', 'test123')}
                  className="px-2.5 py-1 rounded bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-[11px] text-rose-300 transition-colors"
                  title="Test Disabled Account"
                >
                  Disabled Account (RLY-10099)
                </button>
              </div>
            </div>
          </div>

          {/* Footer Security Notice */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500">
            <span>Authorized Railway Personnel Only</span>
            <span className="font-mono text-slate-400">Security Tier: Level-3</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100 select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <HelpCircle className="w-4 h-4" />
                <span>Credential Assistance</span>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              For security reasons, employee password resets for RailGuard AI must be authenticated through the Railway Division Controller.
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
              <div className="text-slate-400">Divisional IT Helpdesk:</div>
              <div className="text-blue-400 font-bold">Extension 4022 / +91 (265) 264-4022</div>
              <div className="text-slate-400 pt-1">Station Master Office: Room 104, BRC Main</div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;

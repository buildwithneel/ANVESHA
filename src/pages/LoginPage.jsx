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
  ArrowRight,
  HelpCircle,
  X,
  Sun,
  Moon,
  Laptop,
  Check,
  Shield,
  Activity,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { authService } from '../services/authService';
import { RailGuardLogo } from '../components/common/RailGuardLogo';
import { useTheme } from '../hooks/useTheme';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

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
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

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

      // Smooth, professional success transition
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
    <div className="min-h-screen w-full bg-canvas text-text-primary flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-accent selection:text-white transition-colors duration-200">
      {/* ── Top Header Navigation Bar ────────────────────────── */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-2 px-1">
        <div className="flex items-center gap-3">
          <RailGuardLogo showSubtitle={false} />
          <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider text-text-muted px-2 py-0.5 rounded border border-border bg-surface-raised">
            Operations Portal
          </span>
        </div>

        {/* Header Right Actions: Status & Theme Toggle */}
        <div className="flex items-center gap-3">
          {/* Live System Status Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetry Active · Vadodara Div.</span>
          </div>

          {/* Dual Theme Switcher Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-surface-hover transition-all text-xs font-semibold shadow-xs"
              aria-label="Toggle Theme Mode"
            >
              {theme === 'dark' ? (
                <Moon className="w-3.5 h-3.5 text-blue-400" />
              ) : theme === 'light' ? (
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Laptop className="w-3.5 h-3.5 text-text-muted" />
              )}
              <span className="capitalize">{theme} Theme</span>
            </button>

            {themeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setThemeDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-36 rg-card p-1 shadow-xl z-50 animate-fade-in">
                  {[
                    { key: 'light', label: 'Light', icon: Sun },
                    { key: 'dark', label: 'Dark', icon: Moon },
                    { key: 'system', label: 'System', icon: Laptop },
                  ].map(({ key, label, icon: ModeIcon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setTheme(key);
                        setThemeDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors',
                        theme === key
                          ? 'bg-accent-soft text-accent font-semibold'
                          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <ModeIcon className="w-3.5 h-3.5" />
                        <span>{label}</span>
                      </div>
                      {theme === key && <Check className="w-3.5 h-3.5 text-accent" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Container ──────────────────────────────────── */}
      <div className="w-full max-w-5xl mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-border bg-surface shadow-xl overflow-hidden transition-all">
        {/* ── Left Brand & Operational Section (5 Cols) ─────── */}
        <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-surface-raised border-b lg:border-b-0 lg:border-r border-border">
          <div className="space-y-6">
            {/* National Railway Emblem Branding */}
            <div>
              <RailGuardLogo variant="login" strokeWidth="2" />
              <p className="mt-3 text-xs text-text-secondary leading-relaxed">
                AI-assisted CCTV video intelligence, real-time crowd surge monitoring, and worker safety surveillance for Indian Railways.
              </p>
            </div>

            {/* Philosophy Pill Indicators */}
            <div className="pt-2 flex items-center gap-2.5 text-xs text-text-secondary font-medium border-t border-border/80">
              <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Monitor
              </span>
              <span className="text-text-muted">·</span>
              <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-500/10 text-text-primary border border-border">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Understand
              </span>
              <span className="text-text-muted">·</span>
              <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Respond
              </span>
            </div>

            {/* Live Operational System Telemetry Box */}
            <div className="p-3.5 rounded-xl border border-border bg-surface space-y-2.5 text-xs">
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center justify-between">
                <span>Real-Time Status</span>
                <Activity className="w-3.5 h-3.5 text-accent" />
              </div>

              <div className="flex items-center justify-between text-text-secondary">
                <span className="flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-text-muted" />
                  CCTV Camera Network
                </span>
                <span className="font-mono text-text-primary font-bold">24 Feeds Monitored</span>
              </div>

              <div className="flex items-center justify-between text-text-secondary">
                <span className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-text-muted" />
                  AI Detection Engine
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">YOLOv8 + DeepSORT</span>
              </div>

              <div className="flex items-center justify-between text-text-secondary">
                <span className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-text-muted" />
                  WebSocket Channel
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Connected
                </span>
              </div>
            </div>
          </div>

          {/* Demo Persona Quick Switcher */}
          <div className="pt-6 border-t border-border space-y-3 mt-6 lg:mt-0">
            <div className="text-xs font-extrabold uppercase tracking-wider text-text-primary dark:text-text-secondary font-mono">
              Quick Role Demo Select (1-Click Fill):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('RLY-10042', 'officer123')}
                className={cn(
                  'p-2.5 rounded-xl border text-left transition-all tactile-button flex items-center gap-2.5',
                  employeeId === 'RLY-10042'
                    ? 'bg-accent-soft border-accent text-accent font-bold shadow-xs'
                    : 'bg-surface border-border hover:bg-surface-hover text-text-primary'
                )}
              >
                <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center text-xs flex-shrink-0">
                  RS
                </div>
                <div className="truncate leading-tight">
                  <div className="font-extrabold text-text-primary text-xs">Rahul Sharma</div>
                  <div className="text-[11px] text-text-secondary font-mono">RLY-10042 · Officer</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('RLY-10001', 'admin123')}
                className={cn(
                  'p-2.5 rounded-xl border text-left transition-all tactile-button flex items-center gap-2.5',
                  employeeId === 'RLY-10001'
                    ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300 font-bold shadow-xs'
                    : 'bg-surface border-border hover:bg-surface-hover text-text-primary'
                )}
              >
                <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 font-extrabold flex items-center justify-center text-xs flex-shrink-0">
                  AP
                </div>
                <div className="truncate leading-tight">
                  <div className="font-extrabold text-text-primary text-xs">Ananya Patel</div>
                  <div className="text-[11px] text-text-secondary font-mono">RLY-10001 · Admin</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Sign-In Section (7 Cols) ─────────────────── */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6 bg-surface">
          <div>
            {/* Header Title */}
            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-text-primary tracking-tight font-heading">
                Sign In
              </h2>
              <p className="text-sm font-semibold text-text-secondary">
                Enter your authorized employee credentials to open ANVESHA
              </p>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div
                role="alert"
                className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-fade-in font-bold"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed font-bold">{errorMessage}</span>
              </div>
            )}

            {/* Success Transition */}
            {successUser && (
              <div
                role="status"
                className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 animate-fade-in font-bold"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>
                  Authenticated as <strong>{successUser.name}</strong>. Opening console...
                </span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Employee ID */}
              <div className="space-y-1.5">
                <label
                  htmlFor="employee-id"
                  className="block text-xs font-extrabold text-text-primary tracking-wide"
                >
                  Employee ID / Service No.
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-primary">
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
                    className="w-full pl-10 pr-3 py-3 bg-surface-raised border border-border rounded-xl text-sm font-mono font-bold text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-extrabold text-text-primary tracking-wide"
                  >
                    Passcode
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-extrabold text-accent hover:underline transition-colors"
                  >
                    Forgot passcode?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-primary">
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
                    className="w-full pl-10 pr-10 py-3 bg-surface-raised border border-border rounded-xl text-sm font-sans font-bold text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-primary hover:text-accent transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Device Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-text-primary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent/20"
                  />
                  <span>Remember session for shift</span>
                </label>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading || Boolean(successUser)}
                className={cn(
                  'w-full py-3.5 px-4 rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 tactile-button',
                  loading || Boolean(successUser)
                    ? 'bg-accent/70 text-white cursor-wait'
                    : 'bg-accent hover:bg-accent-hover text-white active:scale-[0.99]'
                )}
              >
                <span>{loading ? 'Authenticating...' : successUser ? 'Verified' : 'Sign In to ANVESHA'}</span>
                {!loading && !successUser && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>

          {/* Footer Security Notice */}
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-text-secondary">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-accent" />
              Indian Railways Official Operations System
            </span>
            <span className="font-mono text-text-primary font-bold">Tier-3 Security</span>
          </div>
        </div>
      </div>

      {/* ── Footer Copyright ────────────────────────────────── */}
      <footer className="w-full max-w-6xl mx-auto py-2 text-center text-[11px] text-text-muted">
        <span>ANVESHA Platform · Western Railway Zone · Division Headquarters</span>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl space-y-4 text-text-primary select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-accent font-bold text-sm">
                <HelpCircle className="w-4 h-4" />
                <span>Credential Reset Protocol</span>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              For railway security compliance, operator passwords must be reset via your Divisional IT Administrator or Station Master's office.
            </p>

            <div className="p-3 bg-surface-raised rounded-xl border border-border text-xs font-mono space-y-1">
              <div className="text-text-muted">Divisional IT Helpline:</div>
              <div className="text-accent font-bold">Extension 4022 / +91 (265) 264-4022</div>
              <div className="text-text-muted pt-1">Station Master Office: Room 104, BRC Main</div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-colors"
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


import React, { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthLayout } from '../components/layout/AuthLayout';
import { GoogleButton } from '../components/layout/GoogleButton';
import { LogIn, AlertCircle, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, verifyLoginOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      setStep('otp');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) setError('Invalid email or password.');
      else if (err?.response) setError('Something went wrong. Please try again.');
      else setError('Cannot reach the server. Is the backend running on port 8000?');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...otp];
    pastedData.forEach((char, i) => {
      if (/^\d$/.test(char) && i < 6) {
        newOtp[i] = char;
      }
    });
    setOtp(newOtp);
    const focusIndex = Math.min(pastedData.length, 5);
    otpRefs.current[focusIndex]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await verifyLoginOtp(email, code);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid verification code.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'otp') {
    return (
      <AuthLayout>
        <div className="auth-header">
          <ShieldCheck size={48} className="auth-icon-large" style={{ color: 'var(--primary-light)', margin: '0 auto 1rem' }} />
          <h1 className="auth-title">Two-Step Verification</h1>
          <p className="auth-subtitle">
            We sent a 6-digit code to <br/>
            <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleVerifyOtp} className="auth-form">
          <div className="otp-container" style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '2rem 0' }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (otpRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                onPaste={handleOtpPaste}
                style={{
                  width: '45px', height: '55px', fontSize: '24px', textAlign: 'center',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--surface-50)', color: 'var(--text-primary)'
                }}
                required
              />
            ))}
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            {submitting ? 'Verifying...' : <>Verify Code <ArrowRight size={16} /></>}
          </button>
        </form>
        
        <p className="auth-alt" style={{ marginTop: '1.5rem' }}>
          Didn't receive the code? <button type="button" className="auth-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }} onClick={handleSubmit}>Resend</button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="auth-header">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your QuoteGuard workspace.</p>
      </div>

      <GoogleButton onError={setError} />

      <div className="auth-divider"><span>or continue with email</span></div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div className="auth-input-wrap">
            <Mail size={16} className="auth-input-icon" />
            <input
              type="email"
              className="form-input auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="username"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="auth-input-wrap">
            <Lock size={16} className="auth-input-icon" />
            <input
              type={showPw ? 'text' : 'password'}
              className="form-input auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <button type="button" className="auth-input-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
          {submitting ? 'Signing in…' : <><LogIn size={16} /> Sign In</>}
        </button>
      </form>

      <p className="auth-alt">
        Don't have an account? <Link to="/signup" className="auth-link">Create one</Link>
      </p>

      <div className="auth-demo">
        <span className="auth-demo-label">Demo credentials</span>
        sales.manager@vertexind.com · quoteguard123
      </div>
    </AuthLayout>
  );
};

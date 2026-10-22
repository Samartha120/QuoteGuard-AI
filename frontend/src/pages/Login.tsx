import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthLayout } from '../components/layout/AuthLayout';
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
  const [resendCooldown, setResendCooldown] = useState(5);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: any;
    if (step === 'otp' && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await login(email, password);
      if (res && 'user' in res) {
        navigate(from, { replace: true });
      } else {
        setStep('otp');
        setResendCooldown(5);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) setError('Invalid email or password.');
      else if (status === 429) setError(err?.response?.data?.detail || 'Please wait a moment before requesting another code.');
      else if (err?.response?.data?.detail) setError(err.response.data.detail);
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
            We sent a 6-digit verification code to <br/>
            <strong>{email}</strong>
            <button
              type="button"
              onClick={() => { setStep('login'); setError(null); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-light)',
                cursor: 'pointer',
                fontSize: '12px',
                marginLeft: '8px',
                textDecoration: 'underline'
              }}
            >
              (Change)
            </button>
          </p>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            marginTop: '12px',
            textAlign: 'center'
          }}>
            Please check your inbox or spam folder. Real OTP codes expire in 5 minutes.
          </div>
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
          Didn't receive the code?{' '}
          {resendCooldown > 0 ? (
            <span style={{ color: 'var(--text-secondary)', fontSize: 'inherit' }}>
              Resend in {resendCooldown}s
            </span>
          ) : (
            <button
              type="button"
              className="auth-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}
              onClick={() => handleSubmit()}
              disabled={submitting}
            >
              Resend Code
            </button>
          )}
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

      <div
        className="auth-demo"
        onClick={() => {
          setEmail('sales.manager@vertexind.com');
          setPassword('quoteguard123');
        }}
        style={{ cursor: 'pointer' }}
        title="Click to auto-fill credentials"
      >
        <div className="auth-demo-header">
          <span className="auth-demo-badge">Quick Demo Access</span>
          <span className="auth-demo-action">Click to fill</span>
        </div>
        <div className="auth-demo-creds">
          <span>sales.manager@vertexind.com</span>
          <span className="auth-demo-sep">/</span>
          <span>quoteguard123</span>
        </div>
      </div>
    </AuthLayout>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthLayout } from '../components/layout/AuthLayout';
import { GoogleButton } from '../components/layout/GoogleButton';
import { UserPlus, AlertCircle, Mail, Lock, User as UserIcon, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

export const Signup: React.FC = () => {
  const { register, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      setStep('otp');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) setError(err?.response?.data?.detail || 'An account with this email already exists.');
      else if (status === 422) setError(err?.response?.data?.detail || 'Please check your details.');
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

    // Auto-advance
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
      await verifyOtp(email, code);
      navigate('/', { replace: true });
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
          <h1 className="auth-title">Verify your email</h1>
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
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start generating source-grounded quotes in minutes.</p>
      </div>

      <GoogleButton onError={setError} />

      <div className="auth-divider"><span>or sign up with email</span></div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <div className="auth-input-wrap">
            <UserIcon size={16} className="auth-input-icon" />
            <input
              type="text"
              className="form-input auth-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              autoComplete="name"
              required
            />
          </div>
        </div>

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
              autoComplete="email"
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
              placeholder="At least 6 characters"
              autoComplete="new-password"
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
          {submitting ? 'Creating account…' : <><UserPlus size={16} /> Create Account</>}
        </button>
      </form>

      <p className="auth-alt">
        Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
      </p>
    </AuthLayout>
  );
};

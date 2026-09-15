import React, { useRef, useState } from 'react';
import { signInUser, registerUser } from '../services/authService';

// Matches the browser's email-input syntax, without its validation popup.
const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const emailRef = useRef(null);
  const emailValidationError = !email.trim()
    ? 'Please enter your email address.'
    : !EMAIL_PATTERN.test(email.trim()) ? 'Please enter a valid email address.' : '';
  const emailError = emailTouched ? emailValidationError : '';
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const passwordRef = useRef(null);
  const passwordValidationError = !password
    ? 'Please enter your password.'
    : password.length < 6 ? 'Your password must be at least 6 characters.' : '';
  const passwordError = passwordTouched ? passwordValidationError : '';
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmationTouched, setConfirmationTouched] = useState(false);
  const confirmationRef = useRef(null);
  const confirmationError = !isLogin && confirmationTouched
    ? (!confirmPassword ? 'Please confirm your password.' : confirmPassword !== password ? 'Your passwords don’t match.' : '')
    : '';
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setMessage('');
    setEmailTouched(true);
    setPasswordTouched(true);
    if (!isLogin) setConfirmationTouched(true);
    if (emailValidationError) {
      emailRef.current?.focus();
      return;
    }
    if (passwordValidationError) {
      passwordRef.current?.focus();
      return;
    }
    if (!isLogin && (!confirmPassword || confirmPassword !== password)) {
      setConfirmationTouched(true);
      confirmationRef.current?.focus();
      return;
    }
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await signInUser(email, password);
      } else {
        result = await registerUser(email, password);
      }

      if (result.success) {
        setMessage(result.message);
        onLogin(result.user);
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        <p className="eyebrow">WELCOME TO HPAIR</p>
        <h1>{isLogin ? 'Welcome back' : 'Get Started with HPAIR'}</h1>
        <p>{isLogin ? 'Sign in to complete/review your personal information' : 'Create an account here'}</p>

        {message && (
          <div className={`submit-message ${message.includes('successful') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form className="auth-form" noValidate onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Email address</label>
            <input
              ref={emailRef}
              id="auth-email"
              autoComplete="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              className="form-input"
              placeholder="Enter your email"
              aria-required="true"
              aria-invalid={!!emailError}
              aria-describedby={emailError ? 'auth-email-error' : undefined}
            />
            {emailError && <p className="form-error" id="auth-email-error" role="alert">{emailError}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Password</label>
            <input
              ref={passwordRef}
              id="auth-password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
              className="form-input"
              placeholder="Enter your password"
              aria-required="true"
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? 'auth-password-error' : undefined}
            />
            {passwordError && <p className="form-error" id="auth-password-error" role="alert">{passwordError}</p>}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-confirm-password">Confirm Password</label>
              <input
                ref={confirmationRef}
                id="auth-confirm-password"
                autoComplete="new-password"
                type="password"
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                onBlur={() => setConfirmationTouched(true)}
                className="form-input"
                placeholder="Re-enter your password"
                aria-required="true"
                aria-invalid={!!confirmationError}
                aria-describedby={confirmationError ? 'auth-confirm-password-error' : undefined}
              />
              {confirmationError && <p className="form-error" id="auth-confirm-password-error" role="alert">{confirmationError}</p>}
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign in' : 'Create account')}
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'left', marginTop: '20px' }}>
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setConfirmPassword('');
                setConfirmationTouched(false);
                setPasswordTouched(false);
                setEmailTouched(false);
                setMessage('');
              }}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--color-primary)',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              {isLogin ? 'Register here' : 'Login here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

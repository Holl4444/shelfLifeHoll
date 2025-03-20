'use client';
import type React from 'react';
import { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2, CheckCircle } from 'lucide-react';
import styles from './login-form.module.css';

interface LoginFormProps {
  isSignUp: boolean;
  onSuccess: () => void;
}

export function LoginForm({ isSignUp, onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { login, register, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      if (isSignUp) {
        await register(email, password);
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        await login(email, password);
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An error occurred'
      );
    }
  };

  if (success) {
    return (
      <div className={styles.successContainer}>
        <div className={styles.successIconContainer}>
          <CheckCircle className={styles.successIcon} />
        </div>
        <h3 className={styles.successTitle}>
          {isSignUp ? 'Account created!' : 'Login successful!'}
        </h3>
        <p className={styles.successMessage}>
          Redirecting you to the dashboard...
        </p>
      </div>
    );
  }
  console.log('LoginForm component rendering, isSignUp:', isSignUp);
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputGroup}>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={styles.input}
        />
      </div>
      <div className={styles.inputGroup}>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className={styles.input}
        />
      </div>
      {error && <div className={styles.errorMessage}>{error}</div>}
      <Button
        type="submit"
        className={styles.submitButton}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className={styles.loadingIcon} />
        ) : null}
        {isSignUp ? 'Create Account' : 'Sign In'}
      </Button>
    </form>
  );
}

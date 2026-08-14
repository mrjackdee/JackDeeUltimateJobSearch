'use client';
import { LogIn } from 'lucide-react';

export function LoginForm() {
  return <div className="form">
    <a className="button primary" href="/api/auth/google/start"><LogIn size={17}/>Sign in with Google</a>
    <p className="fit">Access is restricted to the authorized Google account. No public sign-up is available.</p>
  </div>;
}

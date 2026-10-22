import { useState, type FormEvent } from 'react';
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { auth, setToken } from '../api';
import './Login.css';

interface LoginProps {
  onLogin: () => void;
  lang?: 'en' | 'ar';
}

const t = {
  en: {
    title: 'Admin Sign In',
    subtitle: 'Welcome back. Sign in to continue to your workspace.',
    brandTitle: 'A better ride starts here.',
    brandSubtitle: 'One place to manage your motorcycle business, customers, and financing.',
    workspace: 'ADMIN WORKSPACE',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    errorFallback: 'Unable to sign in',
    secure: 'Secure access for your team',
    emailPlaceholder: 'you@company.com',
  },
  ar: {
    title: 'تسجيل دخول المسؤول',
    subtitle: 'مرحباً بعودتك. سجل الدخول للمتابعة إلى مساحة العمل.',
    brandTitle: 'رحلتك نحو إدارة أفضل تبدأ هنا.',
    brandSubtitle: 'مساحة واحدة لإدارة نشاط الدراجات والعملاء والتمويل.',
    workspace: 'مساحة الإدارة',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    signIn: 'تسجيل الدخول',
    signingIn: 'جار تسجيل الدخول...',
    errorFallback: 'تعذر تسجيل الدخول',
    secure: 'دخول آمن لفريقك',
    emailPlaceholder: 'you@company.com',
  }
};

export default function Login({ onLogin, lang = 'en' }: LoginProps) {
  const i18n = t[lang];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { accessToken } = await auth.login(email, password);
      setToken(accessToken);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.errorFallback);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <section className="login-brand" aria-label={i18n.workspace}>
        <div className="login-brand-glow login-brand-glow-one" />
        <div className="login-brand-glow login-brand-glow-two" />
        <div className="login-brand-content">
          <div className="login-logo-frame">
            <img className="login-logo" src="/logo.png" alt="مؤسسة أولاد غانم للتوسيكلات" />
          </div>
          <div className="login-brand-copy">
            <span className="login-brand-eyebrow"><Sparkles size={14} /> {i18n.workspace}</span>
            <h2>{i18n.brandTitle}</h2>
            <p>{i18n.brandSubtitle}</p>
          </div>
          <div className="login-brand-footer">
            <span className="login-brand-line" />
            <span>{i18n.secure}</span>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-mobile-logo">
            <img src="/logo.png" alt="مؤسسة أولاد غانم للتوسيكلات" />
          </div>
          <div className="login-heading">
            <span className="login-form-eyebrow">{i18n.workspace}</span>
            <h1>{i18n.title}</h1>
            <p>{i18n.subtitle}</p>
          </div>

          {error && <div className="login-form-error" role="alert">{error}</div>}

          <label className="login-field">
            <span>{i18n.email}</span>
            <span className="login-input-wrap">
              <Mail size={18} aria-hidden="true" />
              <input
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder={i18n.emailPlaceholder}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                autoFocus
                dir="ltr"
              />
            </span>
          </label>

          <label className="login-field">
            <span>{i18n.password}</span>
            <span className="login-input-wrap">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </span>
          </label>

          <button className="login-submit" type="submit" disabled={loading}>
            <span>{loading ? i18n.signingIn : i18n.signIn}</span>
            {!loading && <ArrowRight size={18} aria-hidden="true" />}
            {loading && <span className="login-spinner" aria-hidden="true" />}
          </button>

          <div className="login-security-note">
            <ShieldCheck size={17} aria-hidden="true" />
            <span>{i18n.secure}</span>
          </div>
        </form>
      </section>
    </main>
  );
}
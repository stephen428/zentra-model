import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'register') {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
    }

    const result = await signIn('credentials', {
      redirect: false,
      email: form.email,
      password: form.password,
    });

    if (result?.error) {
      setError('Invalid email or password');
      setLoading(false);
    } else {
      router.push('/');
    }
  }

  return (
    <>
      <Head><title>Zentra — Sign in</title></Head>
      <div style={{
        minHeight: '100vh', background: '#0f0f0f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}>
        <div style={{
          background: '#1a1a1a', border: '1px solid #2a2a2a',
          borderRadius: 12, padding: '40px 36px', width: 360,
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
              Zentra
            </div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
              {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
            </div>
          </div>

          <form onSubmit={submit}>
            {mode === 'register' && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Full name</label>
                <input name="name" type="text" value={form.name} onChange={handle}
                  required placeholder="Jane Smith" style={inputStyle} />
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email address</label>
              <input name="email" type="email" value={form.email} onChange={handle}
                required placeholder="jane@company.com" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Password</label>
              <input name="password" type="password" value={form.password} onChange={handle}
                required placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
                style={inputStyle} />
            </div>

            {error && (
              <div style={{
                background: '#2a1a1a', border: '1px solid #5a2a2a',
                borderRadius: 6, padding: '10px 12px',
                color: '#ff6b6b', fontSize: 13, marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '11px 0', background: '#5dcaa5',
              border: 'none', borderRadius: 7, color: '#0a1f18',
              fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#666' }}>
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <span onClick={() => { setMode('register'); setError(''); }}
                  style={{ color: '#5dcaa5', cursor: 'pointer' }}>Sign up</span>
              </>
            ) : (
              <>Already have an account?{' '}
                <span onClick={() => { setMode('login'); setError(''); }}
                  style={{ color: '#5dcaa5', cursor: 'pointer' }}>Sign in</span>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
};
const inputStyle = {
  width: '100%', padding: '9px 12px', background: '#0f0f0f',
  border: '1px solid #2a2a2a', borderRadius: 6, color: '#e0ddd5',
  fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};

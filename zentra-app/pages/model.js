import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';

export default function ModelPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const iframeRef = useRef(null);

  const [modelId, setModelId] = useState(id || null);
  const [modelName, setModelName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status]);

  // When the page loads with an id, load that model into the iframe
  useEffect(() => {
    if (id && loaded) loadModel(id);
  }, [id, loaded]);

  // Listen for messages from the iframe (model sends its state)
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'zentra:ready') setLoaded(true);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  async function loadModel(modelId) {
    const res = await fetch(`/api/models/${modelId}`);
    if (!res.ok) return;
    const data = await res.json();
    setModelName(data.name);
    setModelId(data.id);
    // Send state into the iframe
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'zentra:load', state: data.state },
      '*'
    );
  }

  async function getStateFromIframe() {
    return new Promise((resolve) => {
      const handler = (e) => {
        if (e.data?.type === 'zentra:state') {
          window.removeEventListener('message', handler);
          resolve(e.data.state);
        }
      };
      window.addEventListener('message', handler);
      iframeRef.current?.contentWindow?.postMessage({ type: 'zentra:getState' }, '*');
      setTimeout(() => { window.removeEventListener('message', handler); resolve(null); }, 5000);
    });
  }

  async function save() {
    const name = modelName.trim() || 'Untitled model';
    if (!modelName.trim()) {
      const input = prompt('Name this model:', 'My financial model');
      if (!input) return;
      setModelName(input);
    }

    setSaving(true);
    setSaveMsg('');

    const state = await getStateFromIframe();
    if (!state) { setSaving(false); setSaveMsg('Could not read model state'); return; }

    const res = await fetch('/api/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: modelId, name: modelName.trim() || name, state }),
    });
    const data = await res.json();

    if (data.id) {
      setModelId(data.id);
      router.replace(`/model?id=${data.id}`, undefined, { shallow: true });
    }

    setSaving(false);
    setSaveMsg('Saved ✓');
    setTimeout(() => setSaveMsg(''), 3000);
  }

  if (status === 'loading' || status === 'unauthenticated') {
    return <div style={{ background: '#0f0f0f', height: '100vh' }} />;
  }

  return (
    <>
      <Head>
        <title>{modelName ? `${modelName} · Zentra` : 'Zentra'}</title>
      </Head>
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: '#0f0f0f',
      }}>
        {/* Slim top bar */}
        <div style={{
          background: '#1a1a1a', borderBottom: '1px solid #2a2a2a',
          padding: '0 16px', height: 44, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          gap: 12,
        }}>
          {/* Left: back + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push('/')} style={{
              background: 'none', border: 'none', color: '#666',
              cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px',
            }} title="Back to dashboard">
              ←
            </button>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
              Zentra
            </span>
            <span style={{ color: '#3a3a3a', fontSize: 16 }}>|</span>
            <input
              value={modelName}
              onChange={e => setModelName(e.target.value)}
              placeholder="Model name…"
              style={{
                background: 'none', border: 'none', outline: 'none',
                color: '#e0ddd5', fontSize: 13, width: 200, fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Right: save */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {saveMsg && (
              <span style={{ fontSize: 12, color: '#5dcaa5' }}>{saveMsg}</span>
            )}
            <button onClick={save} disabled={saving} style={{
              background: '#5dcaa5', color: '#0a1f18', border: 'none',
              borderRadius: 6, padding: '6px 14px', fontSize: 12,
              fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Saving…' : modelId ? 'Save' : 'Save model'}
            </button>
          </div>
        </div>

        {/* Model iframe — fills remaining space */}
        <iframe
          ref={iframeRef}
          src="/model.html"
          style={{ flex: 1, border: 'none', width: '100%' }}
          onLoad={() => {
            // Give iframe a moment to initialise, then signal ready
            setTimeout(() => setLoaded(true), 500);
          }}
        />
      </div>
    </>
  );
}

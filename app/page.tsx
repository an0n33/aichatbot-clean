'use client';
import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('');
  const [err, setErr] = useState('');

  async function send() {
    setReply(''); setErr('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: input }] })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || res.statusText);
      const msg = json?.choices?.[0]?.message?.content ?? JSON.stringify(json);
      setReply(String(msg));
    } catch (e: any) {
      setErr(e?.message || 'Request failed');
    }
  }

  return (
    <main style={{maxWidth: 720, margin: '40px auto', padding: 16, fontFamily: 'ui-sans-serif, system-ui'}}>
      <h1 style={{fontSize: 24, marginBottom: 12}}>Anon Chat — safe root page</h1>
      <textarea
        style={{width: '100%', minHeight: 120, padding: 8}}
        placeholder="Say hi…"
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <div style={{marginTop: 12, display: 'flex', gap: 8}}>
        <button onClick={send} style={{padding: '8px 12px', cursor: 'pointer'}}>Send</button>
        <button onClick={() => {setInput(''); setReply(''); setErr('');}} style={{padding: '8px 12px'}}>Clear</button>
      </div>
      {reply && (
        <pre style={{whiteSpace: 'pre-wrap', marginTop: 16, padding: 12, background: '#111', color: '#eee', borderRadius: 8}}>
{reply}
        </pre>
      )}
      {err && <div style={{marginTop: 16, color: 'crimson'}}>Error: {err}</div>}
    </main>
  );
}

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(function() {
    if (status === 'unauthenticated') router.push('/login');
  }, [status]);

  useEffect(function() {
    if (status === 'authenticated') {
      fetch('/api/models')
        .then(function(r) { return r.json(); })
        .then(function(d) { setModels(Array.isArray(d) ? d : []); setLoading(false); });
    }
  }, [status]);

  if (status === 'loading' || status === 'unauthenticated') {
    return <div style={{background:'#0f0f0f',minHeight:'100vh'}}></div>;
  }

  return (
    <div style={{minHeight:'100vh',background:'#0f0f0f',fontFamily:'sans-serif',color:'#e0ddd5'}}>
      <div style={{background:'#1a1a1a',borderBottom:'1px solid #2a2a2a',padding:'0 32px',display:'flex',alignItems:'center',justifyContent:'space-between',height:'56px'}}>
        <div style={{fontSize:'18px',fontWeight:700,color:'#fff'}}>Zentra</div>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <span style={{fontSize:'13px',color:'#888'}}>{session.user.email}</span>
          <button onClick={function(){signOut({callbackUrl:'/login'});}} style={{background:'transparent',color:'#888',border:'none',cursor:'pointer',fontSize:'13px'}}>Sign out</button>
        </div>
      </div>
      <div style={{maxWidth:'900px',margin:'0 auto',padding:'40px 24px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'28px'}}>
          <h1 style={{fontSize:'22px',fontWeight:700,margin:0,color:'#fff'}}>My models</h1>
          <button onClick={function(){router.push('/model');}} style={{background:'#5dcaa5',color:'#0a1f18',border:'none',borderRadius:'6px',padding:'8px 16px',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>+ New model</button>
        </div>
        {loading && <div style={{textAlign:'center',padding:'60px',color:'#555'}}>Loading...</div>}
        {!loading && models.length === 0 && (
          <div style={{background:'#1a1a1a',border:'1px solid #2a2a2a',borderRadius:'10px',padding:'48px',textAlign:'center'}}>
            <div style={{fontSize:'32px',marginBottom:'12px'}}>📊</div>
            <div style={{fontSize:'16px',fontWeight:600,color:'#fff',marginBottom:'8px'}}>No models yet</div>
            <div style={{fontSize:'13px',color:'#666',marginBottom:'20px'}}>Create your first financial model to get started</div>
            <button onClick={function(){router.push('/model');}} style={{background:'#5dcaa5',color:'#0a1f18',border:'none',borderRadius:'6px',padding:'8px 16px',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>+ New model</button>
          </div>
        )}
        {!loading && models.length > 0 && (
          <div style={{display:'grid',gap:'10px'}}>
            {models.map(function(m) {
              return (
                <div key={m.id} style={{background:'#1a1a1a',border:'1px solid #2a2a2a',borderRadius:'8px',padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}} onClick={function(){router.push('/model?id='+m.id);}}>
                  <div>
                    <div style={{fontSize:'15px',fontWeight:600,color:'#fff',marginBottom:'3px'}}>{m.name}</div>
                    <div style={{fontSize:'12px',color:'#555'}}>Last updated {new Date(m.updatedAt).toLocaleDateString('en-GB')}</div>
                  </div>
                  <div style={{display:'flex',gap:'8px'}} onClick={function(e){e.stopPropagation();}}>
                    <button onClick={function(){router.push('/model?id='+m.id);}} style={{background:'#2a2a2a',color:'#e0ddd5',border:'1px solid #3a3a3a',borderRadius:'6px',padding:'6px 12px',fontSize:'12px',cursor:'pointer'}}>Open</button>
                    <button onClick={function(){if(confirm('Delete?')){fetch('/api/models/'+m.id,{method:'DELETE'}).then(function(){setModels(models.filter(function(x){return x.id!==m.id;}));});}}} style={{background:'transparent',color:'#ff6b6b',border:'none',borderRadius:'6px',padding:'6px 10px',fontSize:'12px',cursor:'pointer'}}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

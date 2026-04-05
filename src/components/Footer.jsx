import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Twitter, Globe, Info, Mail, ShieldCheck, FileText, Zap, ExternalLink, Users, Music, X, Lock } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

export default function Footer() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState(false);

    const handlePinSubmit = (e) => {
        e.preventDefault();
        if (pin === '2026') {
            sessionStorage.setItem('admin_authenticated', 'true');
            setShowPinModal(false);
            setPin('');
            navigate('/admin');
        } else {
            setPinError(true);
            setTimeout(() => setPinError(false), 2000);
        }
    };

    return (
        <>
            <footer style={{ backgroundColor: '#000000', padding: '80px 40px 40px', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#94a3b8', fontFamily: '"Outfit", sans-serif' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '48px', marginBottom: '60px' }}>

                        {/* Brand Column */}
                        <div style={{ gridColumn: 'span 2' }}>
                            <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '20px' }}>
                                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', color: 'white', letterSpacing: '-1.2px', textTransform: 'uppercase' }}>
                                    JUNIOR<span style={{ color: '#00A3FF' }}>LUGO</span>
                                </h1>
                            </div>
                            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', maxWidth: '300px', marginBottom: '24px' }}>
                                {t('heroSubtitle') || 'Producción musical de élite, mezcla y masterización. Más allá del sonido, creamos tu legado.'}
                            </p>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                {[
                                    { icon: <Instagram size={20} />, url: 'https://www.instagram.com/juniorlug' },
                                    { icon: <Youtube size={20} />, url: 'https://www.youtube.com/@juniorlugoproducciones' },
                                    { icon: <Music size={18} />, url: 'https://www.tiktok.com/@juniorlugoproducciones' },
                                ].map(({ icon, url }, i) => (
                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#64748b', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'} onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
                                        {icon}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Producction Services */}
                        <div>
                            <h4 style={{ color: 'white', fontWeight: '800', fontSize: '1rem', marginBottom: '24px', letterSpacing: '0.5px' }}>SERVICIOS</h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                                <li onClick={() => navigate('/produccion-integral')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'white'} onMouseLeave={e => e.target.style.color = '#94a3b8'}>Producción Integral</li>
                                <li onClick={() => navigate('/mezcla-y-mastering')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'white'} onMouseLeave={e => e.target.style.color = '#94a3b8'}>Mezcla y Mastering</li>
                                <li onClick={() => navigate('/arreglos-musicales')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'white'} onMouseLeave={e => e.target.style.color = '#94a3b8'}>Arreglos Musicales</li>
                                <li onClick={() => navigate('/partituras-pro')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'white'} onMouseLeave={e => e.target.style.color = '#94a3b8'}>Partituras Pro</li>
                            </ul>
                        </div>

                        {/* Store / Marketplace */}
                        <div>
                            <h4 style={{ color: 'white', fontWeight: '800', fontSize: '1rem', marginBottom: '24px', letterSpacing: '0.5px' }}>TIENDA</h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                                <li onClick={() => navigate('/store')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'white'} onMouseLeave={e => e.target.style.color = '#94a3b8'}>Secuencias Multitrack</li>
                                <li onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'white'} onMouseLeave={e => e.target.style.color = '#94a3b8'}>Mis Compras</li>
                                <li onClick={() => navigate('/store')} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'white'} onMouseLeave={e => e.target.style.color = '#94a3b8'}>Nuevos Lanzamientos</li>
                            </ul>
                        </div>

                        {/* Support */}
                        <div>
                            <h4 style={{ color: 'white', fontWeight: '800', fontSize: '1rem', marginBottom: '24px', letterSpacing: '0.5px' }}>CONTACTO</h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                                <li onClick={() => window.open('https://wa.me/5215519805954', '_blank')} style={{ cursor: 'pointer', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={e => e.target.style.color = 'white'} onMouseLeave={e => e.target.style.color = '#94a3b8'}>
                                    <Zap size={14} /> WhatsApp Directo
                                </li>
                                <li style={{ color: '#94a3b8' }}>México / International</li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                        <div style={{ fontSize: '0.85rem' }}>
                            © {new Date().getFullYear()} Junior Lugo Producciones. Todos los derechos reservados. | Potenciado por <a href="https://freedomlabs.dev" target="_blank" rel="noopener noreferrer" style={{ color: '#FFFFFF', fontWeight: '800', textDecoration: 'none', marginLeft: '5px' }}>Freedom Labs</a>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Music size={14} color="#FFFFFF" />
                            <span style={{ color: '#FFFFFF', fontWeight: '700' }}>Junior Lugo v3.0</span>
                            <span 
                                onClick={() => setShowPinModal(true)}
                                style={{ marginLeft: '15px', color: '#FFFFFF', opacity: 0.8, cursor: 'pointer', fontSize: '0.75rem', fontWeight: '800', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '15px' }}
                            >
                                ADMIN
                            </span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Premium PIN Modal */}
            {showPinModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.95)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    animation: 'pinFadeIn 0.3s ease-out'
                }}>
                    <div style={{
                        background: '#0a0a0a',
                        padding: '40px',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '400px',
                        border: `1px solid ${pinError ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                        textAlign: 'center',
                        position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        animation: pinError ? 'pinShake 0.5s' : 'pinScaleIn 0.3s ease-out'
                    }}>
                        <button 
                            onClick={() => { setShowPinModal(false); setPin(''); }}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{
                            width: '60px',
                            height: '60px',
                            background: 'rgba(0,163,255,0.1)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            color: '#00A3FF'
                        }}>
                            <Lock size={28} />
                        </div>

                        <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '900', marginBottom: '8px', letterSpacing: '1px' }}>ACCESO MAESTRO</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '32px' }}>Ingrese el PIN de seguridad para continuar.</p>

                        <form onSubmit={handlePinSubmit}>
                            <input 
                                autoFocus
                                type="password"
                                placeholder="----"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: '#1a1a1a',
                                    border: `2px solid ${pinError ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: '12px',
                                    padding: '16px',
                                    fontSize: '1.5rem',
                                    color: 'white',
                                    textAlign: 'center',
                                    letterSpacing: '10px',
                                    fontWeight: '900',
                                    marginBottom: '24px',
                                    transition: 'all 0.2s ease',
                                    outline: 'none'
                                }}
                            />
                            {pinError && (
                                <p style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: '700', marginBottom: '20px' }}>PIN INCORRECTO</p>
                            )}
                            <button 
                                type="submit"
                                style={{
                                    width: '100%',
                                    background: '#00A3FF',
                                    color: 'white',
                                    border: 'none',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    fontWeight: '900',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                }}
                                onMouseEnter={e => e.target.style.background = '#0084CC'}
                                onMouseLeave={e => e.target.style.background = '#00A3FF'}
                            >
                                VERIFICAR CREDENCIALES
                            </button>
                        </form>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes pinFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes pinScaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes pinShake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-8px); }
                    75% { transform: translateX(8px); }
                }
            `}</style>
        </>
    );
}

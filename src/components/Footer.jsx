import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Twitter, Globe, Info, Mail, ShieldCheck, FileText, Zap, ExternalLink, Users, Music } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

export default function Footer() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
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
                            {t('heroSubtitle')}
                        </p>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        {[
                            { icon: <Instagram size={20} />, url: 'https://www.instagram.com/juniorlug' },
                            { icon: <Youtube size={20} />, url: 'https://www.youtube.com/@juniorlugoproducciones' },
                            { icon: <Facebook size={20} />, url: '#' }
                        ].map((soc, i) => (
                            <a key={i} href={soc.url} target="_blank" rel="noopener noreferrer" style={{ color: '#64748b', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'} onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
                                {soc.icon}
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
                        onClick={() => {
                            const pin = prompt('Ingrese PIN de acceso:');
                            if (pin === '2026') {
                                sessionStorage.setItem('admin_authenticated', 'true');
                                navigate('/admin');
                            } else if (pin !== null) {
                                alert('PIN Incorrecto');
                            }
                        }}
                        style={{ marginLeft: '10px', opacity: 0.2, cursor: 'pointer', fontSize: '0.7rem' }}
                    >
                        Admin
                    </span>
                </div>
            </div>
        </div>
    </footer>
    );
}


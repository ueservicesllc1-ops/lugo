import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Headphones, CheckCircle2, Home, Globe, Zap, Music2, Star, PlayCircle, Layers,
    Disc, Cpu, Activity, Waves, Settings, BarChart, Send
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import Footer from '../components/Footer';

const MezclaMastering = () => {
    const navigate = useNavigate();
    const { t, language, toggleLanguage } = useTranslation();

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', fontFamily: '"Inter", sans-serif' }}>
            {/* HEADER / NAV */}
            <header style={{ position: 'fixed', top: 0, width: '100%', padding: '20px 40px', background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: 'white' }}>JUNIOR<span style={{ color: '#8B5CF6' }}>LUGO</span></h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button 
                        onClick={toggleLanguage}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <Globe size={14} /> {language === 'es' ? 'EN' : 'ES'}
                    </button>
                    <button 
                        onClick={() => navigate('/')} 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <Home size={16} /> {t('backToHome')}
                    </button>
                </div>
            </header>

            {/* HERO SECTION */}
            <section style={{ paddingTop: '160px', paddingBottom: '100px', textAlign: 'center', background: 'radial-gradient(circle at top, rgba(139,92,246,0.1) 0%, transparent 60%)' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 20px', borderRadius: '50px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#8B5CF6', fontSize: '0.8rem', fontWeight: '800', marginBottom: '30px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        <Zap size={14} fill="#8B5CF6" /> {t('worldClassSound')}
                    </div>
                    <h1 style={{ fontSize: '4.5rem', fontWeight: '900', marginBottom: '24px', letterSpacing: '-2.5px', lineHeight: '1' }}>
                        {t('mixMasterHeroTitle')} <span style={{ background: 'linear-gradient(to right, #8B5CF6, #D946EF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('mixMasterHeroTitle2')}</span>
                    </h1>
                    <p style={{ fontSize: '1.4rem', color: '#94a3b8', lineHeight: '1.6', maxWidth: '750px', margin: '0 auto 40px' }}>
                        {t('mixMasterSubtitle')}
                    </p>
                    <button 
                        onClick={() => window.open('https://wa.me/5215519805954', '_blank')}
                        style={{ padding: '18px 40px', background: '#8B5CF6', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 30px rgba(139,92,246,0.3)', transition: 'transform 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        {t('startProject')}
                    </button>
                </div>
            </section>

            {/* FEATURES GRID */}
            <section style={{ padding: '80px 20px', background: '#020617' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
                        {[
                            {
                                icon: <Waves size={32} color="#8B5CF6" />,
                                title: t('proMixingTitle'),
                                desc: t('proMixingDesc'),
                                items: ["Balance Tonal", "Profundidad 3D", "Punch y Claridad"]
                            },
                            {
                                icon: <Zap size={32} color="#8B5CF6" />,
                                title: t('proMasteringTitle'),
                                desc: t('proMasteringDesc'),
                                items: ["Volumen Competitivo", "Color Analógico", "Control de Dinámica"]
                            },
                            {
                                icon: <Cpu size={32} color="#8B5CF6" />,
                                title: t('hybridProcess'),
                                desc: t('hybridProcessDesc'),
                                items: ["Hardware Real", "Plugins High-End", "Monitoreo Pro"]
                            }
                        ].map((s, i) => (
                            <div key={i} style={{ padding: '35px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px' }}>
                                <div style={{ color: '#8B5CF6', marginBottom: '20px' }}>{s.icon}</div>
                                <h4 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '15px' }}>{s.title}</h4>
                                <p style={{ color: '#64748b', lineHeight: '1.7', margin: 0 }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* COMPARISON OR DETAIL SECTION */}
            <section style={{ padding: '100px 20px' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '40px' }}>{t('listenPrev')}</h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '60px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ color: '#ef4444', fontWeight: '900', fontSize: '0.8rem', marginBottom: '15px' }}>{t('before')}</div>
                            <button style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', cursor: 'pointer' }}>
                                <PlayCircle size={30} />
                            </button>
                        </div>
                        <div style={{ background: 'rgba(139,92,246,0.05)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(139,92,246,0.1)' }}>
                            <div style={{ color: '#8B5CF6', fontWeight: '900', fontSize: '0.8rem', marginBottom: '15px' }}>{t('after')}</div>
                            <button style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#8B5CF6', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', cursor: 'pointer', boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}>
                                <PlayCircle size={30} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: '100px 20px', textAlign: 'center', background: 'linear-gradient(to bottom, transparent, rgba(139,92,246,0.05))' }}>
                <Send size={48} color="#8B5CF6" style={{ marginBottom: '30px', opacity: 0.5 }} />
                <h3 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '15px' }}>¿TU MEZCLA ESTÁ LISTA?</h3>
                <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '40px' }}>Hagamos que tu música suene increíble hoy mismo.</p>
                <button 
                    onClick={() => window.open('https://wa.me/5215519805954', '_blank')}
                    style={{ padding: '15px 40px', background: '#25D366', color: 'white', border: 'none', borderRadius: '50px', fontSize: '1.1rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto' }}
                >
                    <SmartphoneIcon size={20} /> ENVIAR MI TEMA POR WHATSAPP
                </button>
            </section>

            <Footer />
        </div>
    );
};

const SmartphoneIcon = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
);

export default MezclaMastering;

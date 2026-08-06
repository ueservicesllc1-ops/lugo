import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Music2, Mic2, Layers, Headphones, CheckCircle2, ArrowRight, Home, 
    Smartphone, Globe, Mail, Star, PlayCircle
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

const ProduccionIntegral = () => {
    const navigate = useNavigate();
    const { t, language, toggleLanguage } = useTranslation();

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', fontFamily: '"Inter", sans-serif' }}>
            <Navbar />

            {/* HERO SECTION */}
            <section style={{ paddingTop: '160px', paddingBottom: '100px', textAlign: 'center', background: 'radial-gradient(circle at top, rgba(139,92,246,0.15) 0%, transparent 60%)' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 20px', borderRadius: '50px', background: 'rgba(0,163,255,0.1)', border: '1px solid rgba(0,163,255,0.2)', color: '#00A3FF', fontSize: '0.8rem', fontWeight: '800', marginBottom: '30px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        <Star size={14} fill="#00A3FF" /> {t('highLevelService')}
                    </div>
                    <h1 style={{ fontSize: '4.5rem', fontWeight: '900', marginBottom: '24px', letterSpacing: '-2.5px', lineHeight: '1' }}>
                        {t('prodIntegralTitlePart1')} <span style={{ background: 'linear-gradient(to right, #00A3FF, #00d2d3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('prodIntegralTitlePart2')}</span>
                    </h1>
                    <p style={{ fontSize: '1.4rem', color: '#94a3b8', lineHeight: '1.6', maxWidth: '750px', margin: '0 auto 40px' }}>
                        {t('prodIntegralSubtitle')}
                    </p>
                    <button 
                        onClick={() => window.open('https://wa.me/5215519805954', '_blank')}
                        style={{ padding: '18px 40px', background: '#00A3FF', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,163,255,0.3)', transition: 'transform 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        {t('startProject')}
                    </button>
                </div>
            </section>

            {/* SERVICES GRID */}
            <section style={{ padding: '100px 20px', background: '#020617' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', display: 'grid', gap: '30px' }}>
                        {[
                            {
                                icon: <Headphones size={32} color="#00A3FF" />,
                                title: t('arrangementsComp'),
                                desc: t('arrangementsCompDesc'),
                                items: ["Orquestación completa", "Programación de sintetizadores", "Diseño sonoro"]
                            },
                            {
                                icon: <Mic2 size={32} color="#00A3FF" />,
                                title: t('vocalRecording'),
                                desc: t('vocalRecordingDesc'),
                                items: ["Dirección vocal", "Edición y limpieza", "Tuning profesional"]
                            },
                            {
                                icon: <Headphones size={32} color="#00A3FF" />,
                                title: t('mixProTitle'),
                                desc: t('mixProDesc'),
                                items: ["Eq y Compresión quirúrgica", "Máster para streaming", "Claridad y Profundidad"]
                            }
                        ].map((s, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '40px', borderRadius: '24px', transition: 'all 0.3s' }}>
                                <div style={{ marginBottom: '25px', background: 'rgba(0,163,255,0.1)', width: '60px', height: '60px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {s.icon}
                                </div>
                                <h3 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '15px' }}>{s.title}</h3>
                                <p style={{ color: '#94a3b8', lineHeight: '1.7', marginBottom: '25px' }}>{s.desc}</p>
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                                    {s.items.map((item, j) => (
                                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                                            <CheckCircle2 size={14} color="#10b981" /> {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TEXT SECTION */}
            <section style={{ padding: '100px 20px', background: '#0f172a' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '30px', textAlign: 'center' }}>{t('creativeProcess')}</h2>
                    <div style={{ lineHeight: '1.8', fontSize: '1.1rem', color: '#94a3b8' }}>
                        <p>
                            {t('musicProdDesc')}
                        </p>
                        <p style={{ marginTop: '20px' }}>
                            {t('prodIntegralSubtitle')}
                        </p>
                        <div style={{ marginTop: '40px', padding: '30px', background: 'rgba(0,163,255,0.05)', borderRadius: '16px', borderLeft: '4px solid #00A3FF' }}>
                            <h4 style={{ color: 'white', margin: '0 0 10px', fontSize: '1.2rem' }}>{t('whyChooseProd')}</h4>
                            <p style={{ margin: 0, fontSize: '0.95rem' }}>
                                {t('whyChooseDesc')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', background: 'linear-gradient(135deg, rgba(0,163,255,0.1), rgba(0,210,211,0.1))', padding: '60px', borderRadius: '40px', border: '1px solid rgba(0,163,255,0.1)' }}>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '20px' }}>{t('nextHit')}</h3>
                    <p style={{ color: '#94a3b8', marginBottom: '30px' }}>{t('nextHitDesc')}</p>
                    <button 
                        onClick={() => window.open('https://wa.me/5215519805954', '_blank')}
                        style={{ padding: '15px 30px', background: '#25D366', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto' }}
                    >
                        <Smartphone size={18} /> {t('writeWA')}
                    </button>
                    <div style={{ marginTop: '20px', fontSize: '0.8rem', color: '#64748b' }}>{t('moreTracksSoon')}</div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default ProduccionIntegral;


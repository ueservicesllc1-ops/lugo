import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Layers, Piano, Music, Send, Home, Star, Layout, 
    ListMusic, Palette, Sparkles, Smartphone, ArrowRight, Globe
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import Footer from '../components/Footer';

const ArreglosMusicales = () => {
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
            <section style={{ paddingTop: '160px', paddingBottom: '100px', textAlign: 'center', background: 'radial-gradient(circle at top, rgba(217,70,239,0.1) 0%, transparent 60%)' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 20px', borderRadius: '50px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#8B5CF6', fontSize: '0.8rem', fontWeight: '800', marginBottom: '30px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        <Music2 size={14} fill="#8B5CF6" /> {t('creativeArrangements')}
                    </div>
                    <h1 style={{ fontSize: '4.5rem', fontWeight: '900', marginBottom: '24px', letterSpacing: '-2.5px', lineHeight: '1' }}>
                        {t('arrangementsHeroTitle')} <span style={{ background: 'linear-gradient(to right, #8B5CF6, #D946EF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('arrangementsHeroTitle2')}</span>
                    </h1>
                    <p style={{ fontSize: '1.4rem', color: '#94a3b8', lineHeight: '1.6', maxWidth: '750px', margin: '0 auto 40px' }}>
                        {t('arrangementsSubtitle')}
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

            {/* SERVICES CARDS */}
            <section style={{ padding: '80px 20px', background: '#020617' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
                        {[
                            {
                                icon: <Zap size={32} color="#8B5CF6" />,
                                title: t('modernOrchestration'),
                                desc: t('modernOrchestrationDesc'),
                                items: ["Música Electrónica", "Cuerdas y Metales", "Pop & Worship"]
                            },
                            {
                                icon: <Music2 size={32} color="#8B5CF6" />,
                                title: t('customInstrumentation'),
                                desc: t('customInstrumentationDesc'),
                                items: ["Baterías reales", "Pianos acústicos", "Sintes Analógicos"]
                            },
                            {
                                icon: <Layers size={32} color="#8B5CF6" />,
                                title: t('arrangementProcess'),
                                desc: t('arrangementProcessDesc'),
                                items: ["Análisis Armónico", "Estructura Dinámica", "Entrega de Stems"]
                            }
                        ].map((s, i) => (
                            <div key={i} style={{ padding: '40px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ marginBottom: '25px' }}>{s.icon}</div>
                                <h3 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '15px' }}>{s.title}</h3>
                                <p style={{ color: '#94a3b8', lineHeight: '1.7', margin: 0 }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PHILOSOPHY SECTION */}
            <section style={{ padding: '100px 20px' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '30px', textAlign: 'center' }}>VISTIENDO TU CANCIÓN</h2>
                    <div style={{ lineHeight: '1.8', fontSize: '1.1rem', color: '#94a3b8' }}>
                        <p>
                            Un gran arreglo musical es como un traje a medida. No se trata de cuántos instrumentos usemos, sino de cómo cada uno de ellos sirve a la melodía y el mensaje. En el estudio de **Junior Lugo**, nos apasiona encontrar ese "gancho" musical que hará que tu canción sea recordada.
                        </p>
                        <p style={{ marginTop: '20px' }}>
                            Trabajamos en diversos géneros, desde la música congregacional y adoración contemporánea hasta el pop, balada y fusión latina. Cada arreglo es una colaboración estrecha contigo para asegurar que la visión original de la canción se mantenga intacta pero elevada al máximo nivel profesional.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', background: '#D946EF', padding: '60px', borderRadius: '40px', color: 'white' }}>
                    <ListMusic size={48} style={{ marginBottom: '20px' }} />
                    <h3 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '15px' }}>DALE VIDA A TU MELODÍA</h3>
                    <p style={{ opacity: 0.9, marginBottom: '30px', fontSize: '1.1rem' }}>No importa si solo tienes un audio de voz, nosotros nos encargamos de todo el acompañamiento musical profesional.</p>
                    <button 
                        onClick={() => window.open('https://wa.me/5215519805954', '_blank')}
                        style={{ padding: '15px 40px', background: 'white', color: '#D946EF', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto' }}
                    >
                        <Smartphone size={18} /> CONSULTAR DISPONIBILIDAD
                    </button>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default ArreglosMusicales;

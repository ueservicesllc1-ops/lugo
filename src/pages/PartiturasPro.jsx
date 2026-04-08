import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FileText, ScrollText, PenTool, Home, Send, Star, 
    Printer, Share2, Layers, Smartphone, CheckCircle2, History, Globe
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import Footer from '../components/Footer';

const PartiturasPro = () => {
    const navigate = useNavigate();
    const { t, language, toggleLanguage } = useTranslation();

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', fontFamily: '"Inter", sans-serif' }}>
            {/* HEADER / NAV */}
            <header style={{ position: 'fixed', top: 0, width: '100%', padding: '20px 40px', background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: 'white' }}>JUNIOR<span style={{ color: '#00A3FF' }}>LUGO</span></h1>
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
            <section style={{ paddingTop: '160px', paddingBottom: '100px', textAlign: 'center', background: 'radial-gradient(circle at top, rgba(16,185,129,0.1) 0%, transparent 60%)' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 20px', borderRadius: '50px', background: 'rgba(0,163,255,0.1)', border: '1px solid rgba(0,163,255,0.2)', color: '#00A3FF', fontSize: '0.8rem', fontWeight: '800', marginBottom: '30px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        <ScrollText size={14} fill="#00A3FF" /> {t('precisionDocumentation')}
                    </div>
                    <h1 style={{ fontSize: '4.5rem', fontWeight: '900', marginBottom: '24px', letterSpacing: '-2.5px', lineHeight: '1' }}>
                        {t('sheetMusicHeroTitle')} <span style={{ background: 'linear-gradient(to right, #00A3FF, #00d2d3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('sheetMusicHeroTitle2')}</span>
                    </h1>
                    <p style={{ fontSize: '1.4rem', color: '#94a3b8', lineHeight: '1.6', maxWidth: '750px', margin: '0 auto 40px' }}>
                        {t('sheetMusicSubtitle')}
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
            <section style={{ padding: '80px 20px', background: '#020617' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
                        {[
                            {
                                icon: <Printer size={32} color="#00A3FF" />,
                                title: t('readableCharts'),
                                desc: t('readableChartsDesc'),
                                items: ["PDFs Optimizados", "Layout Limpio", "Símbolos Estándar"]
                            },
                            {
                                icon: <Music size={32} color="#00A3FF" />,
                                title: t('fullOrchestration'),
                                desc: t('fullOrchestrationDesc'),
                                items: ["Audio a Papel", "Arreglo Original", "Múltiples Claves"]
                            },
                            {
                                icon: <CheckCircle2 size={32} color="#00A3FF" />,
                                title: t('livePerformance'),
                                desc: t('livePerformanceDesc'),
                                items: ["Letra e Acordes", "Guía de Estructura", "Entrega Digital"]
                            }
                        ].map((s, i) => (
                            <div key={i} style={{ padding: '40px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
                                <div style={{ marginBottom: '25px' }}>{s.icon}</div>
                                <h3 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '15px' }}>{s.title}</h3>
                                <p style={{ color: '#94a3b8', lineHeight: '1.7', margin: 0 }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* DETAIL SECTION */}
            <section style={{ padding: '100px 20px' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '30px' }}>EL LENGUAJE DE LOS MÚSICOS</h2>
                    <div style={{ lineHeight: '1.8', fontSize: '1.1rem', color: '#94a3b8', textAlign: 'left' }}>
                        <p>
                            Una partitura bien escrita ahorra horas de ensayo. En **Junior Lugo**, no solo transcribimos notas; cuidamos la diagramación, la legibilidad y la terminología musical para que tus músicos puedan concentrarse en lo más importante: la música.
                        </p>
                        <p style={{ marginTop: '20px' }}>
                            Utilizamos software de notación de última generación para entregar archivos PDF de alta resolución y archivos fuente si lo necesitas. Ya sea para una sesión de grabación profesional o para el ministerio en tu iglesia, nuestras partituras son el estándar de excelencia.
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            {["✓ Cifrado Americano preciso", "✓ Dinámicas y Expresión", "✓ Diagramación Limpia", "✓ Melodía y Letra", "✓ Transposición rápida", "✓ Formato PDF/XML"].map((item, idx) => (
                                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '700', fontSize: '0.9rem' }}>
                                    <CheckCircle2 size={16} /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', background: 'rgba(16,185,129,0.05)', padding: '60px', borderRadius: '40px', border: '1px solid rgba(16,185,129,0.1)' }}>
                    <PenTool size={48} color="#10b981" style={{ marginBottom: '20px' }} />
                    <h3 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '15px' }}>¿NECESITAS MÚSICA ESCRITA?</h3>
                    <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Desde transcripciones solistas hasta arreglos corales u orquestales. Cuéntanos qué necesitas.</p>
                    <button 
                        onClick={() => window.open('https://wa.me/5215519805954', '_blank')}
                        style={{ padding: '15px 40px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto' }}
                    >
                        <Smartphone size={18} /> COTIZAR PARTITURA
                    </button>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default PartiturasPro;

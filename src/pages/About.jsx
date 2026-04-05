import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Globe, Music2, Zap, Star, Award, Mic2 } from 'lucide-react';
import Footer from '../components/Footer';

export default function About() {
    const navigate = useNavigate();

    return (
        <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: '"Outfit", sans-serif' }}>
            <nav style={{ padding: '20px 40px', background: '#020617', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontFamily: '"Outfit", sans-serif' }}>
                    <ArrowLeft size={20} /> Volver al inicio
                </button>
                <div style={{ height: '20px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                    <Users size={16} /> Trayectoria
                </div>
            </nav>

            {/* Hero */}
            <div style={{ background: 'radial-gradient(circle at 60% 40%, rgba(139,92,246,0.12), transparent), radial-gradient(circle at 20% 80%, rgba(217,70,239,0.1), transparent)', padding: '90px 40px 80px', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '30px', padding: '8px 18px', marginBottom: '24px' }}>
                    <div style={{ width: '10px', height: '10px', background: '#8B5CF6', borderRadius: '50%' }} />
                    <span style={{ color: '#8B5CF6', fontWeight: '700', fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>MI HISTORIA</span>
                </div>
                <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '900', margin: '0 0 18px', lineHeight: '1', maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto', letterSpacing: '-2px' }}>
                    JUNIOR LUGO
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto', lineHeight: '1.7' }}>
                    Productor Musical, Ingeniero de Mezcla y Arreglista con una visión enfocada en la excelencia y el legado sonoro.
                </p>
            </div>

            {/* Content */}
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '70px 40px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center', marginBottom: '100px' }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '20px' }}>Pasión por la Calidad</h2>
                        <p style={{ color: '#94a3b8', lineHeight: '1.8', fontSize: '1.05rem', marginBottom: '20px' }}>
                            Con años de experiencia en la industria musical, me he especializado en transformar ideas simples en producciones de nivel internacional. Mi enfoque combina la calidez de los procesos analógicos con la precisión de la tecnología digital moderna.
                        </p>
                        <p style={{ color: '#94a3b8', lineHeight: '1.8', fontSize: '1.05rem' }}>
                            Cada proyecto es una oportunidad para crear algo único. No solo busco que suene bien, busco que la música conecte emocionalmente con quien la escucha.
                        </p>
                    </div>
                    <div style={{ background: 'rgba(139,92,246,0.05)', borderRadius: '30px', padding: '40px', border: '1px solid rgba(139,92,246,0.1)', position: 'relative' }}>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {[
                                { icon: <Award size={24} color="#8B5CF6" />, label: 'Producción Integral', text: 'Desde el concepto inicial hasta el master final.' },
                                { icon: <Mic2 size={24} color="#8B5CF6" />, label: 'Dirección Vocal', text: 'Capturando la mejor interpretación del artista.' },
                                { icon: <Zap size={24} color="#8B5CF6" />, label: 'Mezcla Dinámica', text: 'Profundidad, claridad y potencia controlada.' }
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ flexShrink: 0 }}>{item.icon}</div>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>{item.label}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.text}</div>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>

                {/* Values / Mission */}
                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '40px' }}>Lo que define mi trabajo</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
                        {[
                            { title: 'Excelencia', text: 'No hay atajos para el buen sonido. Cada milisegundo de tu canción recibe mi máxima atención.' },
                            { title: 'Respeto al Arte', text: 'Tu visión es lo primero. Mi trabajo es potenciarla, no reemplazarla.' },
                            { title: 'Tecnología', text: 'Uso de las mejores herramientas de la industria para asegurar competitividad global.' }
                        ].map((v, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '15px', color: '#8B5CF6' }}>{v.title}</h3>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.7', margin: 0 }}>{v.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Credits / External */}
                <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(217,70,239,0.1))', borderRadius: '40px', padding: '60px', textAlign: 'center', border: '1px solid rgba(139,92,246,0.1)' }}>
                    <Star size={40} color="#8B5CF6" style={{ marginBottom: '20px' }} />
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '15px' }}>Perfil Verificado en Muso.ai</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px' }}>Puedes revisar mi discografía completa, créditos y colaboraciones oficiales en la plataforma líder de la industria.</p>
                    <button 
                        onClick={() => window.open('https://credits.muso.ai/profile/816a8ebd-5537-4c14-bc2e-4283b52ffbcc', '_blank')}
                        style={{ padding: '16px 40px', background: 'white', color: 'black', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '900', cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        VER CRÉDITOS OFICIALES
                    </button>
                </div>

            </div>
            <Footer />
        </div>
    );
}

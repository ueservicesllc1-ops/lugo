import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, Star, Award, ShieldCheck, Flame } from 'lucide-react';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

export default function Biography() {
    const navigate = useNavigate();

    return (
        <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: '"Outfit", sans-serif' }}>
            <Navbar />

            {/* Hero Section */}
            <div style={{ 
                background: 'radial-gradient(circle at 50% 30%, rgba(0, 163, 255, 0.15), transparent 60%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1), transparent)', 
                padding: '160px 40px 80px', 
                textAlign: 'center',
                position: 'relative'
            }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(0, 163, 255, 0.08)', border: '1px solid rgba(0, 163, 255, 0.2)', borderRadius: '30px', padding: '8px 18px', marginBottom: '24px' }}>
                    <span style={{ width: '8px', height: '8px', background: '#00A3FF', borderRadius: '50%' }} />
                    <span style={{ color: '#00A3FF', fontWeight: '800', fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase' }}>TRAYECTORIA ARTÍSTICA</span>
                </div>
                <h1 style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: '900', margin: '0 0 20px', lineHeight: '1', letterSpacing: '-2px', textTransform: 'uppercase' }}>
                    JUNIOR LUGO
                </h1>
                <p style={{ color: '#94a3b8', fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6', fontWeight: '300' }}>
                    Productor Musical y Arreglista. 20 años de experiencia transformando el sonido y dando vida a producciones de impacto internacional.
                </p>
            </div>

            {/* Main Content Grid */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px 100px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '50px', alignItems: 'flex-start', marginBottom: '80px' }}>
                    {/* Biography Description */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: '900', letterSpacing: '-0.5px', color: 'white' }}>Más de Dos Décadas de Legado Musical</h2>
                        <p style={{ color: '#94a3b8', lineHeight: '1.8', fontSize: '1.05rem', margin: 0 }}>
                            Con una impecable trayectoria de más de **20 años en la industria musical**, Junior Lugo se ha consolidado como un referente en la producción, mezcla y arreglos musicales. Su formación como músico y arreglista le otorga una sensibilidad única para comprender las necesidades expresivas y técnicas de cada obra.
                        </p>
                        <p style={{ color: '#94a3b8', lineHeight: '1.8', fontSize: '1.05rem', margin: 0 }}>
                            A lo largo de su carrera, ha tenido el privilegio de colaborar con artistas internacionales de renombre. Destacan sus trabajos con agrupaciones legendarias como **"Adolescentes Orquesta"** y solistas de talla mundial como **"Carlos Baute"**, aportando arreglos vibrantes y una producción de primer nivel.
                        </p>
                        <p style={{ color: '#94a3b8', lineHeight: '1.8', fontSize: '1.05rem', margin: 0 }}>
                            Su versatilidad musical abarca desde géneros tropicales complejos como la salsa y el merengue, hasta el pop internacional y corrientes urbanas modernas, fusionando de manera magistral la calidez analógica clásica con la potencia de las herramientas digitales contemporáneas.
                        </p>
                    </div>

                    {/* Stats & Key Details Card */}
                    <div style={{ 
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', 
                        borderRadius: '28px', 
                        padding: '40px', 
                        border: '1px solid rgba(255,255,255,0.06)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '30px'
                    }}>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(0, 163, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A3FF', flexShrink: 0 }}>
                                <Award size={28} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>Producción y Arreglos</h3>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0' }}>Enfoque integral que respeta y expande la esencia artística.</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', flexShrink: 0 }}>
                                <Flame size={28} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>Colaboraciones Globales</h3>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0' }}>Socio creativo de artistas de prestigio en América Latina y España.</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e', flexShrink: 0 }}>
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>Calidad Certificada</h3>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0' }}>Créditos oficiales e ingeniería de sonido de nivel de industria.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trajectory Highlights / Quote */}
                <div style={{ 
                    background: 'linear-gradient(135deg, rgba(0, 163, 255, 0.05), rgba(139, 92, 246, 0.05))', 
                    borderRadius: '30px', 
                    padding: '60px 40px', 
                    textAlign: 'center', 
                    border: '1px solid rgba(255,255,255,0.05)',
                    marginBottom: '40px'
                }}>
                    <Star size={44} color="#00A3FF" style={{ marginBottom: '20px' }} />
                    <p style={{ 
                        fontSize: '1.4rem', 
                        fontStyle: 'italic', 
                        lineHeight: '1.7', 
                        color: 'rgba(255,255,255,0.95)', 
                        maxWidth: '850px', 
                        margin: '0 auto 30px',
                        fontWeight: '300'
                    }}>
                        "La música no se trata solo de frecuencias o volumen competitivo; se trata de inmortalizar la emoción. Mi compromiso durante estos 20 años siempre ha sido el mismo: ayudar a que el mensaje del artista perdure para siempre."
                    </p>
                    <span style={{ fontWeight: '800', fontSize: '1rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#00A3FF' }}>— Junior Lugo</span>
                </div>
            </div>
            <Footer />
        </div>
    );
}

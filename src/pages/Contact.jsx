import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Contact() {
    return (
        <div style={{ backgroundColor: '#020617', minHeight: '100vh', color: 'white', fontFamily: '"Outfit", sans-serif', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            {/* Main Content Area */}
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '160px 20px 100px',
                background: 'radial-gradient(circle at 50% 30%, rgba(0, 163, 255, 0.1), transparent 60%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.05), transparent)'
            }}>
                <div style={{ 
                    maxWidth: '800px', 
                    width: '100%', 
                    textAlign: 'center', 
                    background: 'rgba(255,255,255,0.03)', 
                    padding: '80px 40px', 
                    borderRadius: '40px', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '900', marginBottom: '20px', letterSpacing: '-1.5px', textTransform: 'uppercase' }}>
                        ¿LISTO PARA EMPEZAR?
                    </h2>
                    <p style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.25rem)', color: '#94a3b8', marginBottom: '40px', lineHeight: '1.6', fontWeight: '300' }}>
                        Transformemos tu idea en un sonido profesional. Contáctame directamente para hablar de tu proyecto.
                    </p>
                    <button 
                        onClick={() => window.open('https://wa.me/5215519805954', '_blank')} 
                        style={{ 
                            padding: '20px 50px', 
                            fontSize: '1.15rem', 
                            background: '#25D366', 
                            border: 'none', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '15px', 
                            cursor: 'pointer', 
                            borderRadius: '50px', 
                            fontWeight: '900', 
                            color: 'white',
                            boxShadow: '0 10px 30px rgba(37,211,102,0.3)',
                            transition: 'all 0.3s ease',
                            fontFamily: '"Outfit", sans-serif',
                            letterSpacing: '0.5px'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(37,211,102,0.5)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(37,211,102,0.3)'; }}
                    >
                        <span style={{ fontSize: '1.4rem' }}>💬</span> Hablar por WhatsApp
                    </button>
                    <div style={{ marginTop: '35px', color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
                        Servicios personalizados para artistas y bandas.
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

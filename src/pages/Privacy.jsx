import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import Footer from '../components/Footer';

const Section = ({ title, children }) => (
    <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#8B5CF6', marginBottom: '10px', borderLeft: '3px solid #8B5CF6', paddingLeft: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h2>
        <div style={{ color: '#94a3b8', lineHeight: '1.75', fontSize: '0.88rem' }}>{children}</div>
    </div>
);

export default function Privacy() {
    const navigate = useNavigate();
    return (
        <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: '"Outfit", sans-serif' }}>
            <nav style={{ padding: '20px 40px', background: '#020617', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontFamily: '"Outfit", sans-serif' }}>
                    <ArrowLeft size={20} /> Volver al Inicio
                </button>
                <div style={{ height: '20px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                    <Shield size={16} /> Política de Privacidad
                </div>
            </nav>

            <div style={{ maxWidth: '820px', margin: '0 auto', padding: '60px 40px 100px' }}>
                <div style={{ marginBottom: '50px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ width: '28px', height: '28px', background: '#8B5CF6', borderRadius: '50%' }} />
                        <span style={{ color: '#8B5CF6', fontWeight: '700', fontSize: '0.9rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Junior Lugo Productions</span>
                    </div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: '900', margin: '0 0 10px', lineHeight: '1.2' }}>Política de Privacidad</h1>
                    <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Última actualización: Abril 2026</p>
                </div>

                <div style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '12px', padding: '18px 20px', marginBottom: '40px', fontSize: '0.9rem', color: '#94a3b8' }}>
                    En **Junior Lugo**, protegemos su información. Entendemos que su privacidad es fundamental y nos comprometemos a ser transparentes sobre cómo manejamos sus datos.
                </div>

                <Section title="1. Recopilación de Información">
                    <p>Recopilamos información básica para proveer y mejorar nuestros servicios:</p>
                    <ul style={{ marginTop: '10px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <li><strong style={{ color: '#e2e8f0' }}>Información de cuenta</strong>: Nombre completo, correo electrónico y contraseña encriptada.</li>
                        <li><strong style={{ color: '#e2e8f0' }}>Información de pago</strong>: Gestionada de forma segura por Stripe o Paypal. No almacenamos tarjetas de crédito en nuestros servidores.</li>
                    </ul>
                </Section>

                <Section title="2. Uso de los Datos">
                    <p>Sus datos son utilizados exclusivamente para:</p>
                    <ul style={{ marginTop: '10px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <li>Personalizar su experiencia en la plataforma Junior Lugo.</li>
                        <li>Procesar transacciones por servicios de producción o compras en tienda.</li>
                        <li>Comunicar cambios importantes en el servicio.</li>
                    </ul>
                </Section>

                <Section title="3. Protección y Seguridad">
                    <p>Implementamos medidas de seguridad de grado industrial para proteger su información. Esto incluye encriptación SSL en todas las comunicaciones y sistemas de autenticación de Firebase.</p>
                </Section>

                <Section title="4. Sus Derechos">
                    <p>Usted puede acceder, corregir o eliminar su información en cualquier momento a través de su Dashboard en Junior Lugo. También puede contactarnos directamente si necesita asistencia con la gestión de sus datos.</p>
                </Section>
            </div>
            <Footer />
        </div>
    );
}

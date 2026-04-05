import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import Footer from '../components/Footer';

const Section = ({ title, children }) => (
    <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#8B5CF6', marginBottom: '10px', borderLeft: '3px solid #8B5CF6', paddingLeft: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h2>
        <div style={{ color: '#94a3b8', lineHeight: '1.75', fontSize: '0.88rem' }}>{children}</div>
    </div>
);

export default function Terms() {
    const navigate = useNavigate();
    return (
        <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: '"Outfit", sans-serif' }}>
            <nav style={{ padding: '20px 40px', background: '#020617', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontFamily: '"Outfit", sans-serif' }}>
                    <ArrowLeft size={20} /> Volver al inicio
                </button>
                <div style={{ height: '20px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                    <FileText size={16} /> Términos y Condiciones
                </div>
            </nav>

            <div style={{ maxWidth: '820px', margin: '0 auto', padding: '60px 40px 100px' }}>
                <div style={{ marginBottom: '50px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ width: '28px', height: '28px', background: '#8B5CF6', borderRadius: '50%' }} />
                        <span style={{ color: '#8B5CF6', fontWeight: '700', fontSize: '0.9rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Junior Lugo Productions</span>
                    </div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: '900', margin: '0 0 10px', lineHeight: '1.2' }}>Términos y Condiciones</h1>
                    <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Última actualización: Abril 2026</p>
                </div>

                <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '10px', padding: '18px 20px', marginBottom: '40px', fontSize: '0.9rem', color: '#8B5CF6' }}>
                    <strong>Importante:</strong> Al registrarse y utilizar Junior Lugo, usted confirma haber leído, comprendido y aceptado estos Términos y Condiciones en su totalidad. Si no está de acuerdo con alguna parte, por favor no utilice la plataforma.
                </div>

                <Section title="1. Definiciones">
                    <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <li><strong style={{ color: '#e2e8f0' }}>"Plataforma"</strong>: Junior Lugo, incluyendo el sitio web, la aplicación móvil y todos sus servicios asociados.</li>
                        <li><strong style={{ color: '#e2e8f0' }}>"Junior Lugo Productions"</strong>: La empresa operadora de la plataforma por Junior Lugo.</li>
                        <li><strong style={{ color: '#e2e8f0' }}>"Usuario"</strong>: Cualquier persona que se registre y utilice la Plataforma.</li>
                    </ul>
                </Section>

                <Section title="2. Uso de la Plataforma">
                    <p>Para utilizar Junior Lugo debe:</p>
                    <ul style={{ marginTop: '10px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <li>Tener al menos 18 años de edad, o contar con el consentimiento de un adulto responsable.</li>
                        <li>Proporcionar información verdadera y actualizada durante el registro.</li>
                        <li>Mantener la confidencialidad de su contraseña.</li>
                    </ul>
                </Section>

                <Section title="3. Derechos de Propiedad Intelectual">
                    <p>El Usuario reconoce que es responsable de asegurarse de que tiene los derechos necesarios para utilizar cualquier pista o archivo subido a la plataforma.</p>
                    <p style={{ marginTop: '12px' }}>Junior Lugo Productions se reserva el derecho de rechazar o retirar cualquier contenido que pueda infringir derechos de terceros.</p>
                </Section>

                <Section title="4. Suscripciones y Pagos">
                    <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <li>Los cobros se realizan de forma automática según el plan elegido.</li>
                        <li>No se realizan reembolsos por períodos parciales, salvo requerimiento legal.</li>
                    </ul>
                </Section>

                <Section title="5. Marketplace">
                    <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <li>Todo contenido para venta requiere aprobación previa por Junior Lugo.</li>
                        <li>Los precios de venta serán definidos inicialmente por Junior Lugo.</li>
                    </ul>
                </Section>

                <Section title="6. Prohibiciones">
                    <p>El Usuario se compromete a no realizar ingeniería inversa sobre el software de Junior Lugo ni utilizarlo para fines ilegales.</p>
                </Section>

                <Section title="7. Limitación de Responsabilidad">
                    <p>Junior Lugo se provee "tal como es". No garantizamos disponibilidad ininterrumpida del servicio.</p>
                </Section>

                <Section title="8. Ley Aplicable">
                    <p>Estos términos se rigen por las leyes locales aplicables al domicilio de Junior Lugo Productions.</p>
                </Section>
            </div>
            <Footer />
        </div>
    );
}

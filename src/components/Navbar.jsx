import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Search, ShoppingCart, X, ArrowRight, Globe, LogOut, ChevronDown, Menu } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

export default function Navbar({ cartCount }) {
    const navigate = useNavigate();
    const { t, language, toggleLanguage } = useTranslation();
    const [currentUser, setCurrentUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [hoveredNav, setHoveredNav] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const [localCartCount, setLocalCartCount] = useState(0);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userSnap = await getDoc(doc(db, 'users', user.uid));
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        setCurrentUser({
                            ...user,
                            displayName: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : user.displayName
                        });
                    } else {
                        setCurrentUser(user);
                    }
                } catch (e) {
                    setCurrentUser(user);
                }
            } else {
                setCurrentUser(null);
            }
        });

        // Listen to scroll to adjust background opacity
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);

        // Fetch local cart count
        const updateCartCount = () => {
            try {
                const savedCart = localStorage.getItem('cart');
                if (savedCart) {
                    const parsed = JSON.parse(savedCart);
                    setLocalCartCount(parsed.length);
                } else {
                    setLocalCartCount(0);
                }
            } catch (e) {
                setLocalCartCount(0);
            }
        };

        updateCartCount();
        // Set an interval to poll for cart updates (simple reactive way across pages)
        const cartInterval = setInterval(updateCartCount, 1000);

        return () => {
            unsubscribe();
            window.removeEventListener('scroll', handleScroll);
            clearInterval(cartInterval);
        };
    }, []);

    const handleScrollOrNavigate = (elementId) => {
        const isHomePage = window.location.hash === '#/' || window.location.hash === '';
        if (isHomePage) {
            const el = document.getElementById(elementId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        } else {
            navigate(`/#${elementId}`);
            setTimeout(() => {
                const el = document.getElementById(elementId);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        }
    };

    const finalCartCount = cartCount !== undefined ? cartCount : localCartCount;

    return (
        <nav style={{
            backgroundColor: scrolled ? 'rgba(2, 6, 23, 0.95)' : 'rgba(0, 0, 0, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            transition: 'all 0.3s ease',
            zIndex: 2000,
            backdropFilter: 'blur(10px)',
            fontFamily: '"Outfit", sans-serif'
        }}>
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.1rem 5%',
                width: '100%'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '35px' }}>
                    <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', color: 'white', letterSpacing: '-1.5px', textTransform: 'uppercase' }}>
                            JUNIOR<span style={{ color: '#00A3FF' }}>LUGO</span><span style={{ fontSize: '0.6rem', verticalAlign: 'middle', marginLeft: '5px', opacity: 0.5, letterSpacing: '2px' }}>PROD</span>
                        </h1>
                    </div>

                    <div className="hide-mobile" style={{ display: 'flex', gap: '22px', marginLeft: '15px', fontSize: '0.92rem', fontWeight: '600', color: '#94a3b8', alignItems: 'center' }}>
                        {[
                            { 
                                label: 'Tienda', 
                                action: () => navigate('/store'),
                                dropdown: [
                                    { label: 'Secuencias (Multitracks)', desc: 'Multipistas profesionales para Lugo Stage', action: () => navigate('/store?type=multitrack') },
                                    { label: 'Pistas (Instrumentales)', desc: 'Instrumentales y acompañamientos', action: () => navigate('/store?type=single') }
                                ]
                            },
                            { 
                                label: 'Servicios',
                                dropdown: [
                                    { label: 'Producción Integral', desc: 'De la idea al master final', action: () => navigate('/produccion-integral') },
                                    { label: 'Mezcla y Mastering', desc: 'Sonido potente y competitivo', action: () => navigate('/mezcla-y-mastering') },
                                    { label: 'Arreglos Musicales', desc: 'Dirección artística y arreglos', action: () => navigate('/arreglos-musicales') },
                                    { label: 'Partituras Pro', desc: 'Escritura profesional de partituras', action: () => navigate('/partituras-pro') }
                                ]
                            },
                            { label: 'Biografía', action: () => navigate('/biografia') },
                            { label: 'Portafolio', action: () => navigate('/portfolio') },
                            { label: 'Galería', action: () => navigate('/gallery') },
                            { label: 'Academia', action: () => navigate('/academy') },
                            { label: 'Trayectoria', action: () => handleScrollOrNavigate('creditos') },
                            { label: 'Contacto', action: () => navigate('/contact') },
                        ].map(item => (
                            <div 
                                key={item.label}
                                onMouseEnter={() => item.dropdown && setHoveredNav(item.label)}
                                onMouseLeave={() => setHoveredNav(null)}
                                style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
                            >
                                <span
                                    onClick={item.action}
                                    style={{ cursor: 'pointer', transition: 'color 0.2s', textDecoration: 'none', padding: '10px 0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    onMouseEnter={e => e.target.style.color = '#fff'}
                                    onMouseLeave={e => e.target.style.color = '#94a3b8'}
                                >
                                    {item.label} {item.dropdown && <ChevronDown size={12} />}
                                </span>
                                
                                {item.dropdown && hoveredNav === item.label && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: '#0f172a',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: '12px',
                                        width: '260px',
                                        padding: '10px',
                                        boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                        zIndex: 3000
                                    }}>
                                        {item.dropdown.map(subItem => (
                                            <div
                                                key={subItem.label}
                                                onClick={() => { subItem.action(); setHoveredNav(null); }}
                                                style={{
                                                    padding: '10px 14px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    textAlign: 'left'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#fff' }}>{subItem.label}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{subItem.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button 
                        onClick={toggleLanguage}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <Globe size={13} /> {language === 'es' ? 'EN' : 'ES'}
                    </button>

                    {currentUser && (
                        <div style={{ position: 'relative' }}>
                            <div
                                onClick={() => setShowDropdown(!showDropdown)}
                                style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: currentUser?.photoURL ? 'transparent' : 'linear-gradient(135deg,#00d2d3,#9b59b6)',
                                    backgroundImage: currentUser?.photoURL ? `url(${currentUser.photoURL})` : undefined,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: '800', cursor: 'pointer',
                                    border: '2px solid rgba(255,255,255,0.2)'
                                }}
                            >
                                {!currentUser?.photoURL && (currentUser?.displayName || currentUser?.email || 'U')[0].toUpperCase()}
                            </div>

                            {showDropdown && (
                                <div style={{
                                    position: 'absolute', top: '48px', right: 0, background: '#0f172a',
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '240px',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 2000
                                }}>
                                    <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                                            background: currentUser?.photoURL ? `url(${currentUser.photoURL}) center/cover` : 'linear-gradient(135deg,#00d2d3,#9b59b6)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: '800', fontSize: '1rem', border: '1px solid rgba(255,255,255,0.1)'
                                        }}>
                                            {!currentUser?.photoURL && (currentUser?.displayName || currentUser?.email || 'U')[0].toUpperCase()}
                                        </div>
                                        <div style={{ overflow: 'hidden' }}>
                                            <div style={{ fontWeight: '800', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {currentUser?.displayName || currentUser?.email?.split('@')[0]}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {currentUser?.email}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div
                                            onClick={() => { navigate('/dashboard'); setShowDropdown(false); }}
                                            style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#e2e8f0', fontSize: '0.88rem', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.02)' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <Globe size={16} color="#94a3b8" /> Nube principal
                                        </div>
                                        <div
                                            onClick={() => { navigate('/store'); setShowDropdown(false); }}
                                            style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#e2e8f0', fontSize: '0.88rem', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.02)' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <ShoppingCart size={16} color="#94a3b8" /> Tienda
                                        </div>
                                        <div
                                            onClick={() => { auth.signOut(); setShowDropdown(false); }}
                                            style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#f87171', fontSize: '0.88rem', fontWeight: '600' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <LogOut size={16} /> Finalizar la sesión
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginLeft: '10px' }}>
                        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/checkout')}>
                            <ShoppingCart size={20} color="#94a3b8" />
                            {finalCartCount > 0 && (
                                <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#00d2d3', color: 'black', fontSize: '0.65rem', fontWeight: '900', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(0,210,211,0.5)' }}>
                                    {finalCartCount}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}

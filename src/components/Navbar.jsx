import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Search, ShoppingCart, X, ArrowRight, Globe, LogOut, ChevronDown, Menu, Camera, KeyRound, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

export default function Navbar({ cartCount }) {
    const navigate = useNavigate();
    const { t, language, toggleLanguage } = useTranslation();
    const [currentUser, setCurrentUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [hoveredNav, setHoveredNav] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const [localCartCount, setLocalCartCount] = useState(0);

    // Global Auth Modal States
    const [showLoginPanel, setShowLoginPanel] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const avatarInputRef = useRef();

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

        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);

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
        const cartInterval = setInterval(updateCartCount, 1000);

        return () => {
            unsubscribe();
            window.removeEventListener('scroll', handleScroll);
            clearInterval(cartInterval);
        };
    }, []);

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                if (password !== confirmPassword) {
                    setErrorMsg("Las contraseñas no coinciden.");
                    return;
                }
                const userCred = await createUserWithEmailAndPassword(auth, email, password);
                const fullName = `${firstName} ${lastName}`.trim();

                let photoURL = null;
                if (avatarFile) {
                    const avatarRef = ref(storage, `avatars/${userCred.user.uid}`);
                    await uploadBytes(avatarRef, avatarFile);
                    photoURL = await getDownloadURL(avatarRef);
                }

                await updateProfile(userCred.user, { displayName: fullName, ...(photoURL && { photoURL }) });

                await setDoc(doc(db, 'users', userCred.user.uid), {
                    firstName,
                    lastName,
                    email,
                    ...(photoURL && { photoURL }),
                    planId: 'free',
                    createdAt: serverTimestamp()
                }, { merge: true });
            }
            setShowLoginPanel(false);
            // Reset fields
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setFirstName('');
            setLastName('');
            setAvatarFile(null);
            setAvatarPreview(null);
        } catch (error) {
            console.error("Auth error:", error);
            setErrorMsg(error.message);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setErrorMsg("Por favor, ingresa tu correo electrónico primero.");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            setErrorMsg('');
            alert("Te hemos enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.");
        } catch (error) {
            console.error("Reset Password Error:", error);
            setErrorMsg("Error al enviar el correo: " + error.message);
        }
    };

    const handleGoogleAuth = async () => {
        setErrorMsg('');
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            setShowLoginPanel(false);
        } catch (error) {
            console.error("Google Auth error:", error);
            setErrorMsg(error.message);
        }
    };

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
        <>
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
                                { label: 'Multitracks', action: () => navigate('/store') },
                                { 
                                    label: 'Servicios',
                                    dropdown: [
                                        { label: 'Producción Integral', desc: 'De la idea al master final', action: () => navigate('/produccion-integral') },
                                        { label: 'Mezcla y Mastering', desc: 'Sonido potente y competitivo', action: () => navigate('/mezcla-y-mastering') },
                                        { label: 'Arreglos Musicales', desc: 'Dirección artística y arreglos', action: () => navigate('/arreglos-musicales') }
                                    ]
                                },
                                { label: 'Biografía', action: () => navigate('/biografia') },
                                { label: 'Portafolio', action: () => navigate('/portfolio') },
                                { label: 'Galería', action: () => navigate('/gallery') },
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
                        {currentUser ? (
                            <div style={{ position: 'relative' }}>
                                <div
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    style={{
                                        width: '36px', height: '36px', borderRadius: '50%',
                                        background: currentUser?.photoURL ? 'transparent' : 'linear-gradient(135deg,#00bcd4,#9b59b6)',
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
                                                background: currentUser?.photoURL ? `url(${currentUser.photoURL}) center/cover` : 'linear-gradient(135deg,#00bcd4,#9b59b6)',
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
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <button 
                                    onClick={() => { setIsLogin(true); setShowLoginPanel(true); }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#94a3b8',
                                        fontSize: '0.85rem',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'color 0.2s',
                                        fontFamily: '"Outfit", sans-serif'
                                    }}
                                    onMouseEnter={e => e.target.style.color = 'white'}
                                    onMouseLeave={e => e.target.style.color = '#94a3b8'}
                                >
                                    Iniciar Sesión
                                </button>
                                <button 
                                    onClick={() => { setIsLogin(false); setShowLoginPanel(true); }}
                                    style={{
                                        background: '#00A3FF',
                                        border: 'none',
                                        color: 'black',
                                        padding: '8px 20px',
                                        borderRadius: '20px',
                                        fontSize: '0.85rem',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s',
                                        fontFamily: '"Outfit", sans-serif'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    Registrarse
                                </button>
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

            {/* FULLSCREEN AUTH OVERLAY (Dark Premium Design) */}
            {showLoginPanel && (
                <div key="auth-modal" style={{ 
                    position: 'fixed', 
                    inset: 0, 
                    backgroundColor: 'rgba(2, 6, 23, 0.96)', 
                    backdropFilter: 'blur(12px)',
                    zIndex: 4000, 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    overflowY: 'auto', 
                    color: 'white',
                    fontFamily: '"Outfit", sans-serif',
                    padding: '20px'
                }}>
                    <div style={{ position: 'absolute', top: '24px', right: '32px' }}>
                        <button onClick={() => setShowLoginPanel(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <div style={{ width: '100%', maxWidth: '480px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {/* Auth Card */}
                        <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '24px', padding: '40px', boxShadow: '0 30px 60px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                                    <img src="/logo.png" alt="Junior Lugo" style={{ height: '40px', objectFit: 'contain' }} />
                                </div>
                                <h2 style={{ fontSize: '1.6rem', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.5px' }}>{isLogin ? '¡Bienvenido de nuevo!' : 'Crea tu cuenta gratis'}</h2>
                                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Accede a tus recursos y secuencias multitracks de forma segura.</p>
                            </div>

                            {errorMsg && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.82rem', textAlign: 'center', fontWeight: '600' }}>{errorMsg}</div>}

                            <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {!isLogin && (
                                    <>
                                        {/* Avatar Picker */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <div
                                                onClick={() => avatarInputRef.current.click()}
                                                style={{
                                                    width: '80px', height: '80px', borderRadius: '50%',
                                                    border: '2px dashed #00A3FF',
                                                    backgroundImage: avatarPreview ? `url(${avatarPreview})` : 'none',
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    position: 'relative', overflow: 'hidden',
                                                    transition: 'border-color 0.2s'
                                                }}
                                                title="Agregar foto de perfil (opcional)"
                                            >
                                                {!avatarPreview && <Camera size={26} color="#94a3b8" />}
                                            </div>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Foto de perfil <em>(opcional)</em></span>
                                            <input
                                                ref={avatarInputRef}
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={e => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;
                                                    setAvatarFile(file);
                                                    setAvatarPreview(URL.createObjectURL(file));
                                                }}
                                            />
                                        </div>

                                        {/* Name Row */}
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input
                                                type="text"
                                                placeholder="Nombre"
                                                value={firstName}
                                                onChange={e => setFirstName(e.target.value)}
                                                required
                                                style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Apellido"
                                                value={lastName}
                                                onChange={e => setLastName(e.target.value)}
                                                required
                                                style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                                            />
                                        </div>
                                    </>
                                )}
                                <input
                                    type="email"
                                    placeholder="Correo Electrónico"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                                />
                                <input
                                    type="password"
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                                />
                                {!isLogin && (
                                    <input
                                        type="password"
                                        placeholder="Confirmar Contraseña"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                        style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                                    />
                                )}
                                <button type="submit" style={{ padding: '12px', width: '100%', fontSize: '0.9rem', borderRadius: '8px', border: 'none', background: '#00A3FF', color: 'black', fontWeight: '800', cursor: 'pointer', transition: 'opacity 0.2s', marginTop: '5px' }}>
                                    {isLogin ? 'Entrar ahora' : 'Registrarme'}
                                </button>

                                {isLogin && (
                                    <div style={{ textAlign: 'right', marginTop: '-4px' }}>
                                        <span 
                                            onClick={handleForgotPassword} 
                                            style={{ fontSize: '0.75rem', color: '#94a3b8', cursor: 'pointer', textDecoration: 'underline' }}
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </span>
                                    </div>
                                )}
                                <div style={{ position: 'relative', textAlign: 'center', margin: '8px 0' }}>
                                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
                                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#0b0f19', padding: '0 10px', color: '#64748b', fontSize: '0.75rem', fontWeight: '800' }}>O CONTINÚA CON</span>
                                </div>
                                <button type="button" onClick={handleGoogleAuth} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '11px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'white', color: 'black', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem' }}>
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="16" alt="Google" />
                                    Google
                                </button>
                            </form>

                            <div style={{ marginTop: '25px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>
                                {isLogin ? (
                                    <>¿No tienes una cuenta? <span onClick={() => setIsLogin(false)} style={{ color: '#00bcd4', fontWeight: '700', cursor: 'pointer' }}>Regístrate</span></>
                                ) : (
                                    <>¿Ya tienes cuenta? <span onClick={() => setIsLogin(true)} style={{ color: '#00bcd4', fontWeight: '700', cursor: 'pointer' }}>Inicia sesión</span></>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

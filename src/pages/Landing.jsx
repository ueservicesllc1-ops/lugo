import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Search, ShoppingCart, Play, CheckCircle2, Menu, X, ArrowRight, User, KeyRound, Timer, Layers, Music, Music2, Globe, Camera, ChevronLeft, ChevronRight, Instagram, Youtube, ExternalLink } from 'lucide-react';
import Footer from '../components/Footer';
import { HorizontalMixer } from '../components/HorizontalMixer';

export default function Landing() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const avatarInputRef = React.useRef();
    const [isLogin, setIsLogin] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [showLoginPanel, setShowLoginPanel] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isAnnual, setIsAnnual] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [songsForSale, setSongsForSale] = useState([]);
    const [previewSong, setPreviewSong] = useState(null);
    const [previewTracks, setPreviewTracks] = useState([]);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewProgress, setPreviewProgress] = useState(0);
    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
    const carouselRef = React.useRef(null);
    const previewEngineRef = React.useRef(null);
    const [cart, setCart] = useState([]);
    const [toast, setToast] = useState(null);
    const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
    const [latestApp, setLatestApp] = useState(null);
    const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState(null);
    const [galleryPhotos, setGalleryPhotos] = useState([]);
    const [portfolioVideos, setPortfolioVideos] = useState([]);
    const [socials, setSocials] = useState({ instagram: '', youtube: '', tiktok: '', spotify: '' });
    const [multitracksForSale, setMultitracksForSale] = useState([]);
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [selectedSongForOptions, setSelectedSongForOptions] = useState(null);
    const [pricing, setPricing] = useState({ wavPrice: 29.00, stemsPrice: 15.00, mp3Price: 9.00 });

    const scrollGallery = (direction) => {
        if (carouselRef.current) {
            const { scrollLeft, clientWidth } = carouselRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - (clientWidth * 0.8) : scrollLeft + (clientWidth * 0.8);
            carouselRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    const [heroSlides, setHeroSlides] = useState([
        {
            image: '/hero_banner_studio.png',
            title: 'Multitracks con Excelencia',
            subtitle: 'La herramienta definitiva para el músico de hoy.'
        },
        {
            image: '/hero_mockup_mixer_1772898901088.png',
            title: 'Mezclador Pro Integrado',
            subtitle: 'Control total de tu sonido desde cualquier dispositivo.'
        }
    ]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentHeroSlide(prev => (prev + 1) % heroSlides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [heroSlides.length]);

    useEffect(() => {
        const savedCart = localStorage.getItem('lugo_cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch { /* ignore */
                setCart([]);
            }
        }
    }, []);

    const addToCart = (song, variant = null) => {
        setCart(prev => {
            const variantId = variant ? `${song.id}_${variant.id}` : song.id;
            if (prev.some(item => item.cartId === variantId)) return prev;

            const itemToAdd = {
                cartId: variantId,
                id: song.id,
                name: song.name,
                artist: song.artist,
                coverUrl: song.coverUrl,
                price: variant ? variant.price : (song.price || 9.99),
                variantName: variant ? variant.name : (song.isMultitrack ? 'Secuencia' : 'Pista Instrumental'),
                format: variant ? variant.format : (song.isMultitrack ? 'WAV/ZIP' : 'MP3')
            };

            const newCart = [...prev, itemToAdd];
            localStorage.setItem('lugo_cart', JSON.stringify(newCart));
            return newCart;
        });

        const msg = variant 
            ? `¡${song.name} (${variant.name}) agregada!` 
            : `¡${song.name} añadida al carrito!`;

        setToast(msg);
        setTimeout(() => setToast(null), 3000);
        setShowOptionsModal(false);
    };

    const handleBuyClick = (song) => {
        if (song.isMultitrack) {
            setSelectedSongForOptions(song);
            setShowOptionsModal(true);
        } else {
            addToCart(song);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);

        const unsubscribe = onAuthStateChanged(auth, user => {
            setCurrentUser(user);
        });

        getDoc(doc(db, 'settings', 'multitrack_pricing')).then(snap => {
            if (snap.exists()) setPricing(snap.data());
        });

        const fetchSongs = async () => {
            try {
                const q = query(collection(db, 'songs'), where('forSale', '==', true), limit(20));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    // Ordenar por fecha: nuevos arriba para que el Top 10 sea "lo más reciente"
                    const sorted = fetched.sort((a, b) => {
                        const timeA = a.createdAt?.toMillis() || 0;
                        const timeB = b.createdAt?.toMillis() || 0;
                        return timeB - timeA;
                    });
                    
                    // Separar instrumentales de multitracks
                    const beats = sorted.filter(s => !s.isMultitrack);
                    const multis = sorted.filter(s => s.isMultitrack);
                    
                    setSongsForSale(beats);
                    setMultitracksForSale(multis);
                } else {
                    setSongsForSale([]);
                    setMultitracksForSale([]);
                }
            } catch {
                // Maintain placeholders if there's an error
            }
        };
        fetchSongs();

        const fetchBanners = async () => {
            try {
                const snap = await getDocs(query(collection(db, 'banners'), orderBy('createdAt', 'desc')));
                if (!snap.empty) {
                    const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setHeroSlides(fetched);
                }
            } catch (e) {
                console.error("Error fetching banners:", e);
            }
        };

        const fetchLatestApp = async () => {
            try {
                const q = query(collection(db, 'app_versions'), orderBy('createdAt', 'desc'), limit(1));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    setLatestApp(snap.docs[0].data());
                }
            } catch (err) {
                console.error("Error fetching latest app:", err);
            }
        };

        const fetchGallery = async () => {
            try {
                const snap = await getDocs(query(collection(db, 'gallery'), orderBy('createdAt', 'desc')));
                if (!snap.empty) {
                    setGalleryPhotos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                }
            } catch (err) {
                console.error("Error fetching gallery:", err);
            }
        };

        const fetchPortfolio = async () => {
            try {
                const snap = await getDocs(query(collection(db, 'portfolio'), orderBy('createdAt', 'desc')));
                if (!snap.empty) {
                    setPortfolioVideos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                }
            } catch (err) {
                console.error("Error fetching portfolio:", err);
            }
        };

        const fetchSocials = async () => {
            try {
                const { getDoc, doc } = await import('firebase/firestore');
                const snap = await getDoc(doc(db, 'settings', 'socials'));
                if (snap.exists()) setSocials(snap.data());
            } catch (err) { console.error("Error fetching socials:", err); }
        };

        fetchLatestApp();
        fetchBanners();
        fetchGallery();
        fetchPortfolio();
        fetchSocials();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            unsubscribe();
            // Clear engines callback when unmounting
            import('../AudioEngine').then(({ audioEngine }) => {
                if (audioEngine.onProgress) audioEngine.onProgress = null;
            }).catch(() => {});
        };
    }, []);

    const scrollCarousel = (dir) => {
        if (!carouselRef.current) return;
        const { scrollLeft, clientWidth } = carouselRef.current;
        const scrollAmount = clientWidth * 0.8;
        carouselRef.current.scrollTo({
            left: dir === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
            behavior: 'smooth'
        });
    };

    const openPreview = async (song) => {
        setPreviewSong(song);
        setPreviewLoading(true);
        setPreviewProgress(20);

        try {
            const { audioEngine } = await import('../AudioEngine');
            await audioEngine.init();
            await audioEngine.stop();
            await audioEngine.clear();
            previewEngineRef.current = audioEngine;

            // Logic similar to Store.jsx for consistent behavior
            const validTracks = song.tracks?.filter(t => t.name !== '__PreviewMix') || [];
            const isUsingPreviewMixOnly = validTracks.length === 0;
            const useClips = isUsingPreviewMixOnly || validTracks.some(t => t.previewUrl && t.previewUrl !== t.url);
            
            console.log(useClips ? "🚀 Usando clips recortados (Carga rápida)" : "🐌 Usando tracks completos (Carga lenta)");

            const rawTracks = (!isUsingPreviewMixOnly)
                ? validTracks.map(t => ({ id: t.id || Math.random().toString(), name: t.name || 'UNNAMED', url: (useClips ? t.previewUrl : t.url) || t.url }))
                : song.tracks?.filter(t => t.name === '__PreviewMix').map(t => ({ id: 'preview', name: 'DEMO CLIP', url: t.url || t.previewUrl })) || [
                    { id: 'full_demo', name: 'FULL MIX DEMO', url: song.audioUrl || song.demoUrl || '/pads/E.mp3' }
                ];

            const getProxyUrl = (url) => {
                if (!url) return '';
                // Limpiar URLs duplicadas por comas (Legacy fix)
                const cleanUrl = String(url).split(',')[0].trim();
                if (cleanUrl.startsWith('/') || cleanUrl.includes('localhost')) return cleanUrl;
                
                const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                const baseProxy = isLocal ? 'http://localhost:3001' : 'https://mixernew-production.up.railway.app';
                return `${baseProxy}/api/download?url=${encodeURIComponent(cleanUrl)}`;
            };

            const tracksToLoad = rawTracks.map(t => ({ ...t, proxyUrl: getProxyUrl(t.url) }));
            setPreviewTracks(tracksToLoad.map(t => ({ id: t.id, name: t.name, muted: false, solo: false, volume: 0.8, pan: 0 })));

            const batch = [];
            for (const t of tracksToLoad) {
                try {
                    const res = await fetch(t.proxyUrl);
                    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
                    const blob = await res.blob();
                    batch.push({ id: t.id, name: t.name, sourceData: blob });
                } catch (e) {
                    console.warn(`Failed track ${t.name}`, e);
                }
            }

            if (batch.length === 0) throw new Error("No tracks loaded");

            await audioEngine.addTracksBatch(batch);

            if (useClips) {
                await audioEngine.seek(0); // El clip ya empieza en el segundo 20 real
            } else {
                await audioEngine.seek(20); // Track completo, hay que saltar
            }

            await audioEngine.play();
            setIsPreviewPlaying(true);
            setPreviewLoading(false);

            audioEngine.onProgress = (p) => {
                const displayTime = useClips ? (20 + p) : p;
                setPreviewProgress(displayTime);

                const stopTime = useClips ? 40 : 40; // En ambos casos queremos llegar al 40 total
                if (displayTime >= stopTime) {
                    audioEngine.pause();
                    audioEngine.seek(useClips ? 0 : 20);
                    setPreviewProgress(20);
                    setIsPreviewPlaying(false);
                }
            };
        } catch (err) {
            console.error("Preview error:", err);
            setPreviewLoading(false);
        }
    };

    const closePreview = () => {
        if (previewEngineRef.current) {
            previewEngineRef.current.stop();
            previewEngineRef.current.clear();
        }
        setPreviewSong(null);
    };

    const handleVolumeChange = (id, vol) => {
        setPreviewTracks(prev => prev.map(t => t.id === id ? { ...t, volume: vol } : t));
        previewEngineRef.current?.setTrackVolume(id, vol);
    };

    const handleMuteToggle = (id) => {
        setPreviewTracks(prev => prev.map(t => {
            if (t.id === id) {
                const next = !t.muted;
                previewEngineRef.current?.setTrackMute(id, next);
                return { ...t, muted: next };
            }
            return t;
        }));
    };

    const handleSoloToggle = (id) => {
        setPreviewTracks(prev => prev.map(t => {
            if (t.id === id) {
                const next = !t.solo;
                previewEngineRef.current?.setTrackSolo(id, next);
                return { ...t, solo: next };
            }
            return t;
        }));
    };

    const handlePanChange = (id, pan) => {
        setPreviewTracks(prev => prev.map(t => t.id === id ? { ...t, pan } : t));
        const engine = previewEngineRef.current;
        if (engine && engine.setTrackPan) engine.setTrackPan(id, pan);
    };

    const togglePreviewPlayback = async () => {
        if (!previewEngineRef.current) return;
        await previewEngineRef.current.init();
        if (isPreviewPlaying) {
            previewEngineRef.current.pause();
            setIsPreviewPlaying(false);
        } else {
            const useClips = previewSong?.tracks?.some(t => t.previewUrl && t.previewUrl !== t.url);
            if (previewProgress >= 40) {
                await previewEngineRef.current.seek(useClips ? 0 : 20);
                setPreviewProgress(20);
            }
            await previewEngineRef.current.play();
            setIsPreviewPlaying(true);
        }
    };



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

                // Upload avatar if provided
                let photoURL = null;
                if (avatarFile) {
                    const avatarRef = ref(storage, `avatars/${userCred.user.uid}`);
                    await uploadBytes(avatarRef, avatarFile);
                    photoURL = await getDownloadURL(avatarRef);
                }

                await updateProfile(userCred.user, { displayName: fullName, ...(photoURL && { photoURL }) });

                // Set initial user doc in Firestore
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

    return (
        <div style={{ backgroundColor: '#020617', color: 'white', minHeight: '100vh', fontFamily: '"Outfit", sans-serif' }}>

            {/* TOAST DE NOTIFICACIÓN PROFESIONAL */}
            {toast && (
                <div key="toast-notification" style={{
                    position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
                    background: '#0f172a', border: '1px solid #00d2d3', color: 'white',
                    padding: '12px 24px', borderRadius: '50px', zIndex: 5000,
                    boxShadow: '0 10px 30px rgba(0,210,211,0.2)', display: 'flex', alignItems: 'center', gap: '12px',
                    animation: 'slideUp 0.3s ease-out', pointerEvents: 'none'
                }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#00d2d3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={14} color="black" />
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{toast}</span>
                </div>
            )}

            <style key="local-styles">{`
                @keyframes slideUp {
                    from { transform: translate(-50%, 50px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `}</style>



              <nav style={{
                  backgroundColor: '#000000',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  transition: 'all 0.3s ease',
                  zIndex: 2000
              }}>
                <div style={{
                  maxWidth: '1400px',
                  margin: '0 auto',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.2rem 5%',
                  width: '100%'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '35px' }}>
                    <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '900', color: 'white', letterSpacing: '-1.5px', textTransform: 'uppercase' }}>
                            JUNIOR<span style={{ color: '#00A3FF' }}>LUGO</span><span style={{ fontSize: '0.6rem', verticalAlign: 'middle', marginLeft: '5px', opacity: 0.5, letterSpacing: '2px' }}>PROD</span>
                        </h1>
                    </div>

                    <div className="hide-mobile" style={{ display: 'flex', gap: '25px', marginLeft: '20px', fontSize: '0.95rem', fontWeight: '600', color: '#94a3b8' }}>
                        {[
                            { label: 'Catálogo de Productos', id: 'tienda' },
                            { label: 'Servicios', id: 'servicios' },
                            { label: 'Galería', id: 'galeria' },
                        ].map(item => (
                            <span
                                key={item.label}
                                onClick={() => {
                                    const el = document.getElementById(item.id);
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }}
                                style={{ cursor: 'pointer', transition: 'color 0.2s', textDecoration: 'none' }}
                                onMouseEnter={e => e.target.style.color = '#fff'}
                                onMouseLeave={e => e.target.style.color = '#94a3b8'}
                            >
                                {item.label}
                            </span>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    {!currentUser ? (
                        <>
                            <span onClick={() => setShowLoginPanel(true)} style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', color: '#ccc' }}>Iniciar sesión</span>
                            <button className="btn-teal" onClick={() => { setIsLogin(false); setShowLoginPanel(true); }}>
                                Únete gratis
                            </button>
                        </>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            <div
                                onClick={() => setShowDropdown(!showDropdown)}
                                style={{
                                    width: '38px', height: '38px', borderRadius: '50%',
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
                                    position: 'absolute', top: '50px', right: 0, background: '#0f172a',
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '250px',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 2000
                                }}>
                                    <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '14px', alignItems: 'center' }}>
                                        {/* Avatar inside dropdown */}
                                        <div style={{
                                            width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
                                            background: currentUser?.photoURL ? `url(${currentUser.photoURL}) center/cover` : 'linear-gradient(135deg,#00d2d3,#9b59b6)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: '800', fontSize: '1.1rem', border: '2px solid rgba(255,255,255,0.1)'
                                        }}>
                                            {!currentUser?.photoURL && (currentUser?.displayName || currentUser?.email || 'U')[0].toUpperCase()}
                                        </div>
                                        <div style={{ overflow: 'hidden' }}>
                                            <div style={{ fontWeight: '800', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {currentUser?.displayName || currentUser?.email?.split('@')[0]}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {currentUser?.email}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {[
                                            { label: 'Nube principal', icon: <Globe size={18} />, onClick: () => navigate('/dashboard') },
                                            { label: 'Tienda de Pistas', icon: <ShoppingCart size={18} />, onClick: () => navigate('/store') },
                                            { label: 'Lista de deseos', icon: <CheckCircle2 size={18} />, onClick: () => navigate('/store') },
                                            { label: 'Ajustes', icon: <Menu size={18} />, onClick: () => navigate('/dashboard') },
                                        ].map((item, idx) => (
                                            <div
                                                key={idx}
                                                onClick={item.onClick}
                                                style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', color: '#e2e8f0', fontSize: '0.95rem', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <span style={{ color: '#94a3b8' }}>{item.icon}</span> {item.label}
                                            </div>
                                        ))}

                                        <div
                                            onClick={() => { auth.signOut(); setShowDropdown(false); }}
                                            style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', color: '#e2e8f0', fontSize: '0.95rem', fontWeight: '600', transition: 'background 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <span style={{ color: '#94a3b8' }}><ArrowRight size={18} /></span> Finalizar la sesión
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginLeft: '10px' }}>
                        <Search size={19} color="#94a3b8" style={{ cursor: 'pointer' }} />
                        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/checkout')}>
                            <ShoppingCart size={19} color="#94a3b8" />
                            {cart.length > 0 && (
                                <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#00d2d3', color: 'black', fontSize: '0.65rem', fontWeight: '900', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(0,210,211,0.5)' }}>
                                    {cart.length}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
              </div>
            </nav >

            {/* HERO SECTION - PREMIUM CINEMATIC EXPERIENCE */}
             <header style={{
                 position: 'relative',
                 minHeight: '85vh',
                 display: 'flex',
                 alignItems: 'center',
                 padding: '0 60px',
                 overflow: 'hidden',
                 backgroundColor: '#000000'
             }}>
                 {/* IMAGEN HERO: Fondo fusionado a la derecha */}
                 <div style={{ 
                     position: 'absolute', 
                     right: 0, 
                     top: 0, 
                     bottom: 0, 
                     width: '55%', 
                     zIndex: 1,
                     pointerEvents: 'none'
                 }}>
                     {/* Degradado de fusión (Hacia el negro a la izquierda) */}
                     <div style={{
                         position: 'absolute',
                         inset: 0,
                         background: 'linear-gradient(to right, #000000 0%, transparent 35%)',
                         zIndex: 2
                     }} />
                     <img 
                         src="/portada.jpg" 
                         alt="Junior Lugo Studio" 
                         style={{
                             width: '100%',
                             height: '100%',
                             objectFit: 'cover'
                         }}
                     />
                 </div>

                 {/* CONTENEDOR DE TEXTO: Equilibrado */}
                 <div style={{ 
                     display: 'flex', 
                     width: '100%', 
                     maxWidth: '1400px', 
                     margin: '0 auto', 
                     alignItems: 'center', 
                     position: 'relative', 
                     zIndex: 10,
                     padding: '0 5%'
                 }}>
                     <div style={{ flex: 1, textAlign: 'left', maxWidth: '650px' }}>
                         <div style={{ marginBottom: '24px', animation: 'fadeInDown 1s ease-out' }}>

                             
                             <div style={{ marginBottom: '10px', marginTop: '20px' }}>
                                 <img 
                                     src="/logo.png" 
                                     alt="Logo" 
                                     style={{ 
                                         height: 'clamp(256px, 42vw, 513px)', 
                                         objectFit: 'contain', 
                                         animation: 'fadeInDown 1s ease-out'
                                     }} 
                                 />
                             </div>
                         </div>

                         <p style={{
                             fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
                             color: 'rgba(255,255,255,0.9)',
                             maxWidth: '550px',
                             lineHeight: '1.4',
                             marginBottom: '10px',
                             fontWeight: '300',
                             letterSpacing: '0.5px',
                             borderLeft: '3px solid #FFFFFF',
                             paddingLeft: '20px',
                             animation: 'fadeIn 1.5s ease-out'
                         }}>
                             Producción musical para artistas globales.<br/>
                             <strong style={{ fontWeight: '800', letterSpacing: '1px' }}>Más allá del sonido, creamos tu legado.</strong>
                         </p>

                         <div style={{ 
                             display: 'flex', 
                             gap: '15px', 
                             animation: 'fadeInUp 1s ease-out 0.5s both'
                         }}>
                             <button
                                 onClick={() => navigate('/store')}
                                 style={{
                                     padding: '14px 40px',
                                     background: '#FFFFFF',
                                     border: '1px solid #FFFFFF',
                                     borderRadius: '6px',
                                     color: '#000000',
                                     fontSize: '0.85rem',
                                     fontWeight: '800',
                                     cursor: 'pointer',
                                     transition: 'all 0.3s ease',
                                     textTransform: 'uppercase'
                                 }}
                                 onMouseOver={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FFFFFF'; }}
                                 onMouseOut={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#000000'; }}
                             >
                                 Ir a Tienda
                             </button>
                         </div>
                     </div>
                 </div>
             </header>

             <style>{`
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>



            {/* CATÁLOGO DE PRODUCTOS */}
            <section id="tienda" style={{ padding: '20px 40px 100px 40px', background: 'linear-gradient(to bottom, #0000CC 0%, #000000 100%)', position: 'relative', overflow: 'hidden' }}>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
                    @keyframes pulse { 0%,100%{opacity:0.3;} 50%{opacity:1;} }
                    .beat-card:hover { transform: translateY(-8px) !important; }
                    .beat-card:hover .beat-card-overlay { opacity: 1 !important; }
                    .service-card:hover { border-color: rgba(255,255,255,0.2) !important; background: rgba(255,255,255,0.06) !important; }
                    .gallery-img:hover { transform: scale(1.05); }
                    .gallery-img { transition: transform 0.4s ease; }
                `}</style>

                <div style={{ maxWidth: '1300px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px', color: 'white' }}>CATÁLOGO DE PRODUCTOS</h2>
                        <p style={{ color: '#8892a4', fontSize: '0.85rem', letterSpacing: '3px', textTransform: 'uppercase' }}>INSTRUMENTALES EXCLUSIVOS</p>
                    </div>

                    {/* Beat Cards Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                        {(songsForSale.length > 0 ? songsForSale.slice(0, 8) : [
                            { id: 'p1', name: 'Love Trap', artist: 'Junior Lugo', price: '79.00', coverUrl: null },
                            { id: 'p2', name: 'Dark Drill', artist: 'Junior Lugo', price: '59.00', coverUrl: null },
                            { id: 'p3', name: 'Afro Pop', artist: 'Junior Lugo', price: '49.00', coverUrl: null },
                            { id: 'p4', name: 'Trap Melodic', artist: 'Junior Lugo', price: '59.00', coverUrl: null },
                        ]).map((track, i) => (
                            <div
                                key={track.id || i}
                                className="beat-card"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'transform 0.3s ease',
                                    position: 'relative'
                                }}
                            >
                                {/* Cover art */}
                                <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', background: '#0d1428' }}>
                                    <img
                                        src={track.coverUrl || `https://picsum.photos/seed/${track.id || i}/300/300`}
                                        alt={track.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={e => { e.target.src = 'https://juniorlugoproducciones.my.canva.site/_assets/media/86c9224aafa4cc886d9b45995298444f.jpg'; }}
                                    />
                                    {/* Hover overlay */}
                                    <div className="beat-card-overlay" style={{
                                        position: 'absolute', inset: 0,
                                        background: 'rgba(0,0,0,0.6)',
                                        opacity: 0,
                                        transition: 'opacity 0.3s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openPreview(track); }}
                                            style={{ background: 'white', border: 'none', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <Play size={20} fill="black" color="black" style={{ marginLeft: '3px' }} />
                                        </button>
                                    </div>
                                    {/* Script title overlay */}
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0,
                                        padding: '40px 16px 12px',
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)'
                                    }}>
                                        <span style={{
                                            fontFamily: '"Dancing Script", cursive',
                                            fontSize: '1.6rem',
                                            color: 'white',
                                            fontWeight: '700'
                                        }}>{track.name}</span>
                                    </div>
                                </div>

                                {/* Card body */}
                                <div style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '1rem', fontWeight: '800', color: '#c8d0e0' }}>${track.price || '49.00'} <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>USD</span></span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openPreview(track); }}
                                            style={{
                                                flex: 1,
                                                padding: '8px',
                                                background: 'rgba(255,255,255,0.06)',
                                                border: '1px solid rgba(255,255,255,0.12)',
                                                borderRadius: '4px',
                                                color: '#8892a4',
                                                fontSize: '0.72rem',
                                                fontWeight: '700',
                                                letterSpacing: '1px',
                                                cursor: 'pointer',
                                                textTransform: 'uppercase',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '5px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = '#8892a4'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                                        >
                                            <Play size={11} fill="currentColor" /> ESCUCHAR
                                        </button>
                                        <button
                                            onClick={() => { addToCart(track); navigate('/checkout'); }}
                                            style={{
                                                flex: 1,
                                                padding: '8px',
                                                background: 'rgba(255,255,255,0.09)',
                                                border: '1px solid rgba(255,255,255,0.18)',
                                                borderRadius: '4px',
                                                color: 'white',
                                                fontSize: '0.72rem',
                                                fontWeight: '700',
                                                letterSpacing: '1px',
                                                cursor: 'pointer',
                                                textTransform: 'uppercase',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
                                        >COMPRAR</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Ver catálogo completo */}
                    <div style={{ textAlign: 'center' }}>
                        <button
                            onClick={() => navigate('/store')}
                            style={{
                                padding: '12px 36px',
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.25)',
                                borderRadius: '4px',
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                letterSpacing: '2px',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                transition: 'all 0.3s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'white'; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                        >VER CATÁLOGO COMPLETO +</button>
                    </div>
                </div>
            </section>

            {/* MULTITRACKS EN VENTA - SECCION ADICIONAL */}
            <section style={{ padding: '80px 40px', backgroundColor: '#000000', position: 'relative' }}>
                <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '10px', color: '#FFFFFF' }}>MULTITRACKS EN VENTA</h2>
                        <p style={{ color: 'white', fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Sesiones profesionales de estudio listas para tu motor</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '32px' }}>
                        {multitracksForSale.length > 0 ? multitracksForSale.map((track, i) => (
                            <div 
                                key={track.id || i}
                                style={{ 
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(139,92,246,0.05) 100%)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(139,92,246,0.15)',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.15)'; }}
                            >
                                <div style={{ position: 'relative', aspectRatio: '1/1' }}>
                                    <img 
                                        src={track.coverUrl || '/studio_placeholder.png'} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        onError={e => {e.target.src = '/hero_banner_studio.png'}}
                                    />
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <button 
                                            onClick={() => openPreview(track)}
                                            style={{ background: '#FFFFFF', border: 'none', width: '50px', height: '50px', borderRadius: '50%', color: 'black', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Play size={20} fill="black" />
                                        </button>
                                    </div>
                                    <div style={{ position: 'absolute', bottom: '15px', right: '15px', background: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '900', backdropFilter: 'blur(4px)' }}>
                                        ZIP SESSION
                                    </div>
                                </div>
                                <div style={{ padding: '20px' }}>
                                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', fontWeight: '800' }}>{track.name}</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 15px 0' }}>{track.artist}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#FFFFFF' }}>${track.price || '99.00'}</span>
                                        <button 
                                            onClick={() => handleBuyClick(track)}
                                            style={{ background: 'transparent', border: '1px solid #FFFFFF', color: '#FFFFFF', padding: '6px 15px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#000000'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FFFFFF'; }}
                                        >AGREGAR</button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#334155' }}>
                                <Music2 size={48} style={{ opacity: 0.1, margin: '0 auto 10px' }} />
                                <p>Próximos lanzamientos de multitracks...</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* SERVICIOS DE PRODUCCIÓN */}
            <section id="servicios" style={{ padding: '100px 40px', background: 'linear-gradient(to bottom, #0000CC 0%, #000000 100%)' }}>
                <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '10px', color: 'white' }}>SERVICIOS DE PRODUCCIÓN</h2>
                        <p style={{ color: '#8892a4', fontSize: '0.85rem', letterSpacing: '3px', textTransform: 'uppercase' }}>¿QUÉ PUEDO HACER POR TU MÚSICA?</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                        {[
                            {
                                icon: (
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M9 19V6l12-3v13" /><circle cx="6" cy="19" r="3" /><circle cx="18" cy="16" r="3" />
                                    </svg>
                                ),
                                title: 'Producción Musical',
                                desc: 'Desarrollo integral de canciones desde la idea inicial hasta el master final, trabajando cada proyecto bajo una sola visión artística y sonora.',
                                link: '#contacto'
                            },
                            {
                                icon: (
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <line x1="18" y1="20" x2="18" y2="10" />
                                        <line x1="12" y1="20" x2="12" y2="4" />
                                        <line x1="6" y1="20" x2="6" y2="14" />
                                        <line x1="3" y1="7" x2="21" y2="7" strokeDasharray="2 2" opacity="0.4" />
                                    </svg>
                                ),
                                title: 'Mezcla Profesional',
                                desc: 'Balanceo y procesamiento de todos los elementos de tu canción para lograr un sonido cohesivo, potente y competitivo.',
                                link: '#contacto'
                            },
                            {
                                icon: (
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <rect x="2" y="3" width="20" height="14" rx="2" />
                                        <line x1="8" y1="21" x2="16" y2="21" />
                                        <line x1="12" y1="17" x2="12" y2="21" />
                                        <path d="M7 8h10M7 11h6" />
                                    </svg>
                                ),
                                title: 'Masterización',
                                desc: 'Preparación final de tu canción para distribución en plataformas digitales con el máximo nivel de calidad y volumen competitivo.',
                                link: '#contacto'
                            },
                            {
                                icon: (
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                        <line x1="12" y1="19" x2="12" y2="23" />
                                        <line x1="8" y1="23" x2="16" y2="23" />
                                    </svg>
                                ),
                                title: 'Grabación de Voces',
                                desc: 'Sesión de grabación vocal con dirección artística para capturar la mejor interpretación de cada canción.',
                                link: '#contacto'
                            }
                        ].map((svc, i) => (
                            <div
                                key={i}
                                className="service-card"
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '8px',
                                    padding: '36px 28px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <div style={{ color: 'rgba(255,255,255,0.6)' }}>{svc.icon}</div>
                                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'white', margin: 0, letterSpacing: '0.5px' }}>{svc.title}</h3>
                                <p style={{ color: '#6b778a', fontSize: '0.87rem', lineHeight: '1.65', margin: 0 }}>{svc.desc}</p>
                                <a
                                    href={svc.link}
                                    onClick={e => { e.preventDefault(); document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' }); }}
                                    style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1px', textDecoration: 'none', textTransform: 'uppercase', marginTop: 'auto', transition: 'color 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'white'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                                >Más Información →</a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* GALERÍA DE FOTOS - ESTILO FILMES PRO */}
            <section id="galeria" style={{ padding: '120px 0', backgroundColor: '#000000', position: 'relative', overflow: 'hidden' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 60px', marginBottom: '60px', textAlign: 'center' }}>
                    <span style={{ color: '#FFFFFF', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '6px', textTransform: 'uppercase', display: 'block', marginBottom: '15px' }}>Visuales</span>
                    <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '900', color: 'white', textTransform: 'uppercase', margin: 0, letterSpacing: '-1px' }}>Experiencia en el Estudio</h2>
                </div>

                {/* Navegación Flotante PRO */}
                <div style={{ 
                    position: 'absolute', 
                    top: '55%', 
                    left: 0, 
                    right: 0, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '0 40px', 
                    zIndex: 20, 
                    pointerEvents: 'none',
                    transform: 'translateY(-50%)'
                }}>
                    <button 
                        onClick={() => scrollGallery('left')}
                        style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '64px', height: '64px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', backdropFilter: 'blur(10px)' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FFFFFF'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                    >
                        <ChevronLeft size={32} color="currentColor" />
                    </button>
                    <button 
                        onClick={() => scrollGallery('right')}
                        style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '64px', height: '64px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', backdropFilter: 'blur(10px)' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FFFFFF'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                    >
                        <ChevronRight size={32} color="currentColor" />
                    </button>
                </div>

                {/* Ventana de Galería Centrada - Escala Pro */}
                <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 40px', position: 'relative' }}>
                    
                    {/* Contenedor de Scroll Limitado */}
                    <div 
                        ref={carouselRef}
                        style={{ 
                            display: 'flex', 
                            overflowX: 'auto', 
                            scrollSnapType: 'x mandatory',
                            gap: '24px', 
                            padding: '30px 0 50px',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            justifyContent: 'flex-start'
                        }}
                        className="gallery-scroll-container"
                    >
                        {(galleryPhotos.length > 0 ? galleryPhotos : [
                            { url: 'https://juniorlugoproducciones.my.canva.site/_assets/media/304b1a4d184946867ea9137eb1bb2a6f.png', caption: 'Salsa Fest. Veracruz. 2023.' },
                            { url: 'https://juniorlugoproducciones.my.canva.site/_assets/media/7de6e9846afef951695af2f65873f3c0.png', caption: 'Estadio El Campín. Bogotá. 2024.' },
                            { url: 'https://juniorlugoproducciones.my.canva.site/_assets/media/86c9224aafa4cc886d9b45995298444f.jpg', caption: 'Estudio de Producción' },
                            { url: 'https://juniorlugoproducciones.my.canva.site/_assets/media/304b1a4d184946867ea9137eb1bb2a6f.png', caption: 'Oscar de León. Salsa Fest 2023.' },
                            { url: 'https://juniorlugoproducciones.my.canva.site/_assets/media/7de6e9846afef951695af2f65873f3c0.png', caption: 'Arena CDMX. Sanyer Nelo Show.' },
                            { url: 'https://juniorlugoproducciones.my.canva.site/_assets/media/86c9224aafa4cc886d9b45995298444f.jpg', caption: 'Feria San Marcos. Carlos Baute.' }
                        ]).map((photo, i) => (
                            <div
                                key={i}
                                onClick={() => setSelectedGalleryPhoto(photo)}
                                style={{
                                    flex: '0 0 calc(25% - 18px)',
                                    height: '220px',
                                    minWidth: '280px',
                                    overflow: 'hidden',
                                    borderRadius: '14px',
                                    position: 'relative',
                                    scrollSnapAlign: 'start',
                                    background: '#111',
                                    boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    cursor: 'zoom-in'
                                }}
                            >
                                <img
                                    src={photo.url}
                                    alt={photo.caption}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.8s ease' }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                />
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 80%)',
                                    zIndex: 2,
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    padding: '20px',
                                    opacity: 0.8,
                                    pointerEvents: 'none'
                                }}>
                                    <span style={{ color: 'white', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', borderLeft: '2px solid #FFFFFF', paddingLeft: '10px' }}>{photo.caption}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>


                <div style={{ textAlign: 'center' }}>
                    <button
                        onClick={() => navigate('/gallery')}
                        style={{
                            padding: '18px 50px',
                            background: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'black',
                            fontSize: '0.9rem',
                            fontWeight: '900',
                            letterSpacing: '1px',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            transition: 'all 0.3s',
                            boxShadow: '0 10px 30px rgba(255, 255, 255, 0.2)'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = '#000000'; e.currentTarget.style.color = 'white'; e.currentTarget.style.border = '1px solid white'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'black'; e.currentTarget.style.border = 'none'; }}
                    > Ver Galería Completa </button>
                </div>




                {/* LIGHTBOX MODAL */}
                {selectedGalleryPhoto && (
                    <div 
                        onClick={() => setSelectedGalleryPhoto(null)}
                        style={{ 
                            position: 'fixed', inset: 0, 
                            backgroundColor: 'rgba(0,0,0,0.95)', 
                            zIndex: 5000, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            padding: '40px' 
                        }}
                    >
                        <button style={{ position: 'absolute', top: '30px', right: '40px', background: 'white', color: 'black', border: 'none', borderRadius: '50%', width: '60px', height: '60px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                            <X size={34} />
                        </button>
                        <div style={{ maxWidth: '90%', maxHeight: '80%', textAlign: 'center' }}>
                            <img 
                                src={selectedGalleryPhoto.url} 
                                alt={selectedGalleryPhoto.caption} 
                                style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '12px', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }} 
                            />
                            <h3 style={{ marginTop: '30px', fontSize: '1.8rem', fontWeight: '900', color: 'white', letterSpacing: '2px', textTransform: 'uppercase' }}>{selectedGalleryPhoto.caption}</h3>
                        </div>
                    </div>
                )}

                <style>{`
                    .gallery-scroll-container::-webkit-scrollbar { display: none; }
                    .gallery-scroll-container { scroll-behavior: smooth; }
                `}</style>
            </section>

            {/* ETAPAS DEL PROCESO */}
            <section id="proceso" style={{ padding: '80px 40px 40px', background: 'linear-gradient(to bottom, #0000CC 0%, #000000 100%)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '10px', color: 'white' }}>ETAPAS DEL PROCESO</h2>
                        <p style={{ color: '#8892a4', fontSize: '0.85rem', letterSpacing: '3px', textTransform: 'uppercase' }}>CÓMO TRABAJAMOS JUNTOS</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2px' }}>
                        {[
                            { step: '01', title: 'PREPRODUCCIÓN', desc: 'Definimos la dirección artística, estructura y concepto de la canción. Arreglos musicales con instrumentos virtuales como herramienta creativa.', icon: '01' },
                            { step: '02', title: 'PRODUCCIÓN', desc: 'Grabación de instrumentos, voces y arreglos musicales. Sustitución de elementos virtuales por instrumentos reales buscando la mejor interpretación.', icon: '02' },
                            { step: '03', title: 'MEZCLA Y MASTERING', desc: 'Pulir la visión artística del proyecto asegurando coherencia, claridad y calidad. Tu canción lista para subir a plataformas digitales.', icon: '03' },
                            { step: '04', title: 'PARTITURAS', desc: 'Entrega de partituras profesionales para presentaciones en vivo con músicos en escena.', icon: '04' }
                        ].map((item, i) => (
                            <div key={i} style={{
                                background: 'rgba(255,255,255,0.025)',
                                padding: '40px 30px',
                                border: '1px solid rgba(255,255,255,0.06)',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                            >
                                <div style={{ fontSize: '3.5rem', fontWeight: '900', color: 'rgba(255,255,255,0.04)', position: 'absolute', top: '10px', right: '16px', fontFamily: 'monospace' }}>{item.step}</div>
                                <div style={{ fontSize: '1.8rem', marginBottom: '20px' }}>{item.icon}</div>
                                <h3 style={{ fontSize: '0.85rem', fontWeight: '800', marginBottom: '14px', color: 'white', letterSpacing: '2px' }}>{item.title}</h3>
                                <p style={{ color: '#6b778a', lineHeight: '1.7', fontSize: '0.88rem' }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PORTAFOLIO / VIDEOS */}
            <section id="portafolio" style={{ padding: '40px 40px 100px', background: 'linear-gradient(to bottom, #0000CC 0%, #000000 100%)' }}>
                <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase', color: 'white', marginBottom: '4px' }}>PORTAFOLIO</h2>
                        <p style={{ color: '#8892a4', fontSize: '0.8rem', letterSpacing: '4px', textTransform: 'uppercase' }}>PRODUCCIONES Y TRABAJOS RECIENTES</p>
                    </div>

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                        gap: '25px',
                        justifyContent: 'center'
                    }}>
                        {(portfolioVideos.length > 0 ? portfolioVideos.slice(0, 6) : [
                            { videoId: 'wJGUbmth5T4', title: 'Whatsap (Y si te miro tanto) - Enza Rigano', genre: 'POP' },
                            { videoId: 'iK7devs8FGc', title: 'Lo que tú pediste - Enza (Urbano)', genre: 'URBANO' },
                            { videoId: '7469MKm5VyA', title: 'Baja la temperatura - Enza Rigano', genre: 'POP' },
                            { videoId: 'NRarqQpM-38', title: 'Sanyer - A la Antigüita', genre: 'FOLKLORE' },
                            { videoId: '7469MKm5VyA', title: 'Baja la temperatura - Enza Rigano', genre: 'POP' },
                            { videoId: 'NRarqQpM-38', title: 'Sanyer - A la Antigüita', genre: 'FOLKLORE' }
                        ]).map((video, idx) => (
                            <div key={idx} style={{ 
                                borderRadius: '12px', 
                                overflow: 'hidden', 
                                border: '1px solid rgba(255,255,255,0.05)', 
                                background: '#0a0f1e', 
                                aspectRatio: '16/9', 
                                position: 'relative',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                                transition: 'all 0.3s ease'
                            }} className="video-card-hover">
                                <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255, 255, 255, 0.8)', padding: '4px 12px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '900', letterSpacing: '1px', color: 'black', zIndex: 2, textTransform: 'uppercase' }}>{video.genre}</div>
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${video.videoId}?rel=0&modestbranding=1`}
                                    title={video.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    style={{ display: 'block' }}
                                ></iframe>
                            </div>
                        ))}
                    </div>

                    {portfolioVideos.length > 6 && (
                        <div style={{ textAlign: 'center', marginTop: '60px' }}>
                            <button 
                                onClick={() => navigate('/portfolio')}
                                style={{
                                    padding: '16px 40px',
                                    background: 'transparent',
                                    border: '2px solid #FFFFFF',
                                    color: '#FFFFFF',
                                    borderRadius: '50px',
                                    fontSize: '0.9rem',
                                    fontWeight: '900',
                                    letterSpacing: '2px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#000000'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FFFFFF'; }}
                            >
                                VER TODO EL PORTAFOLIO
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* TOP 10 RANKING SECTION */}
            <section style={{ padding: '100px 60px', backgroundColor: '#000000' }}>
                <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: '800', marginBottom: '60px' }}>Top 10 de este Mes</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
                        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '32px' }}>
                            {songsForSale.slice(0, 5).map((s, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '16px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                    <span style={{ fontSize: '1.5rem', fontWeight: '900', color: i === 0 ? '#00d2d3' : '#334155', width: '40px' }}>{i + 1}</span>
                                    <div style={{ marginLeft: '12px', flex: 1, overflow: 'hidden' }}>
                                        <div style={{ fontWeight: '700', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{s.artist}</div>
                                    </div>
                                    <button 
                                        onClick={() => openPreview(s)}
                                        className="btn-ghost" 
                                        style={{ marginLeft: 'auto', padding: '6px 16px', fontSize: '0.8rem', border: '1px solid rgba(0,210,211,0.3)', color: '#00d2d3' }}
                                    >
                                        Ver Pistas
                                    </button>
                                </div>
                            ))}
                            {songsForSale.length === 0 && <p style={{ color: '#64748b', textAlign: 'center' }}>Cargando canciones...</p>}
                        </div>
                        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '32px' }}>
                            {songsForSale.slice(5, 10).map((s, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '16px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                    <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#334155', width: '40px' }}>{i + 6}</span>
                                    <div style={{ marginLeft: '12px', flex: 1, overflow: 'hidden' }}>
                                        <div style={{ fontWeight: '700', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{s.artist}</div>
                                    </div>
                                    <button 
                                        onClick={() => openPreview(s)}
                                        className="btn-ghost" 
                                        style={{ marginLeft: 'auto', padding: '6px 16px', fontSize: '0.8rem', border: '1px solid rgba(0,210,211,0.3)', color: '#00d2d3' }}
                                    >
                                        Ver Pistas
                                    </button>
                                </div>
                            ))}
                            {songsForSale.length <= 5 && songsForSale.length > 0 && <p style={{ color: '#64748b', textAlign: 'center', marginTop: '20px' }}>Más pistas próximamente...</p>}
                        </div>
                    </div>
                </div>
            </section >





            {/* PREVIEW MODAL (Horizontal Studio Design) - Compact Version */}
            {
                previewSong && (
                    <div key="preview-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                        <div style={{ background: '#020617', width: '100%', maxWidth: '1300px', maxHeight: '95vh', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', overflowY: 'auto', boxShadow: '0 40px 80px rgba(0,0,0,0.8)', color: 'white', display: 'flex', flexDirection: 'column' }}>

                            <div style={{ padding: '14px 25px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(0,210,211,0.3)', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {previewSong.coverUrl ? (
                                            <img src="/src/assets/studio.png" alt="Junior Lugo Studio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <Music2 size={20} color="#00d2d3" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: '#00d2d3' }}>{previewSong.name}</h3>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>PREVIEW MODE</span>
                                            <span style={{ width: '3px', height: '3px', background: '#334155', borderRadius: '50%' }}></span>
                                            <span style={{ fontSize: '0.7rem', color: '#00d2d3', fontWeight: '800' }}>20 SECONDS</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={closePreview} style={{ background: '#1e293b', border: 'none', width: '32px', height: '32px', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => e.target.style.background = '#ef4444'} onMouseLeave={e => e.target.style.background = '#1e293b'}><X size={16} /></button>
                            </div>

                            <div style={{ padding: '20px 25px' }}>
                                {previewLoading ? (
                                    <div style={{ textAlign: 'center', padding: '50px 0' }}>
                                        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(0,210,211,0.1)', borderTopColor: '#00d2d3', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
                                        <p style={{ color: '#00d2d3', fontSize: '0.9rem', fontWeight: '900', letterSpacing: '1px' }}>INITIALIZING MIXER...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ marginBottom: '20px', maxHeight: '350px', overflowY: 'auto', paddingRight: '5px' }}>
                                            <HorizontalMixer
                                                tracks={previewTracks}
                                                onVolumeChange={handleVolumeChange}
                                                onMuteToggle={handleMuteToggle}
                                                onSoloToggle={handleSoloToggle}
                                                onPanChange={handlePanChange}
                                                progress={previewProgress}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '15px 20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <button
                                                onClick={togglePreviewPlayback}
                                                style={{ background: '#00d2d3', border: 'none', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', cursor: 'pointer', boxShadow: '0 0 20px rgba(0,210,211,0.3)', transition: 'transform 0.2s' }}
                                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                            >
                                                {isPreviewPlaying ? <X size={24} color="black" /> : <Play size={24} fill="black" color="black" style={{ marginLeft: '3px' }} />}
                                            </button>

                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '900', letterSpacing: '0.5px' }}>PLAYBACK (20s-40s)</span>
                                                    <span style={{ color: '#00d2d3', fontSize: '1rem', fontWeight: '900', fontFamily: 'monospace' }}>{previewProgress.toFixed(1)}s</span>
                                                </div>
                                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ width: `${Math.max(0, Math.min(100, ((previewProgress - 20) / 20) * 100))}%`, height: '100%', background: 'linear-gradient(to right, #00d2d3, #00ffff)', boxShadow: '0 0 10px rgba(0,210,211,0.4)', transition: 'width 0.1s linear' }}></div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    addToCart(previewSong);
                                                    closePreview();
                                                    navigate('/checkout');
                                                }}
                                                style={{ background: '#f1c40f', color: 'black', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                            >
                                                <ShoppingCart size={16} /> ADD TO CART
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }



            {/* FULLSCREEN AUTH OVERLAY (Improved Design) */}
            {
                showLoginPanel && (
                    <div key="auth-modal" style={{ position: 'fixed', inset: 0, backgroundColor: '#f9fafb', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', color: '#111827' }}>
                        <div style={{ position: 'absolute', top: '24px', right: '32px' }}>
                            <button onClick={() => setShowLoginPanel(false)} style={{ background: '#e5e7eb', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={20} color="#6b7280" />
                            </button>
                        </div>

                        <div style={{ width: '100%', maxWidth: '1000px', padding: '80px 24px', display: 'flex', gap: '60px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {/* Auth Card */}
                            <div style={{ flex: '1 1 420px', backgroundColor: 'white', borderRadius: '16px', padding: '48px', boxShadow: '0 20px 50px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' }}>
                                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                                        <img src="/logo.png" alt="Junior Lugo" style={{ height: '50px', objectFit: 'contain' }} />
                                    </div>
                                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px' }}>{isLogin ? '¡Bienvenido de nuevo!' : 'Crea tu cuenta gratis'}</h1>
                                    <p style={{ color: '#6b7280' }}>Accede a tus recursos y proyectos musicales exclusivos.</p>
                                </div>

                                {errorMsg && <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem', textAlign: 'center' }}>{errorMsg}</div>}

                                <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {!isLogin && (
                                        <>
                                            {/* ─── Avatar Picker ─── */}
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                <div
                                                    onClick={() => avatarInputRef.current.click()}
                                                    style={{
                                                        width: '90px', height: '90px', borderRadius: '50%',
                                                        background: avatarPreview ? `url(${avatarPreview}) center/cover` : '#e5e7eb',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer', border: '3px dashed #d1d5db',
                                                        position: 'relative', overflow: 'hidden', flexShrink: 0,
                                                        transition: 'border-color 0.2s'
                                                    }}
                                                    title="Agregar foto de perfil (opcional)"
                                                >
                                                    {!avatarPreview && <Camera size={30} color="#9ca3af" />}
                                                    {avatarPreview && (
                                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} className="avatar-overlay">
                                                            <Camera size={22} color="white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Foto de perfil <em>(opcional)</em></span>
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

                                            {/* ─── Name row ─── */}
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Nombre"
                                                    value={firstName}
                                                    onChange={e => setFirstName(e.target.value)}
                                                    required
                                                    style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Apellido"
                                                    value={lastName}
                                                    onChange={e => setLastName(e.target.value)}
                                                    required
                                                    style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                                />
                                            </div>
                                        </>
                                    )}
                                    <input
                                        type="email"
                                        placeholder="Correo electrónico"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        style={{ padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                    />
                                    <input
                                        type="password"
                                        placeholder="Contraseña"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        style={{ padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                    />
                                    {!isLogin && (
                                        <input
                                            type="password"
                                            placeholder="Confirmar Contraseña"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            required
                                            style={{ padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                        />
                                    )}
                                    <button type="submit" className="btn-teal" style={{ padding: '14px', width: '100%', fontSize: '1rem', marginTop: '8px' }}>
                                        {isLogin ? 'Entrar ahora' : 'Registrarme'}
                                    </button>

                                    {isLogin && (
                                        <div style={{ textAlign: 'right', marginTop: '-8px' }}>
                                            <span 
                                                onClick={handleForgotPassword} 
                                                style={{ fontSize: '0.8rem', color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}
                                            >
                                                ¿Olvidaste tu contraseña?
                                            </span>
                                        </div>
                                    )}
                                    <div style={{ position: 'relative', textAlign: 'center', margin: '10px 0' }}>
                                        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb' }} />
                                        <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '0 12px', color: '#9ca3af', fontSize: '0.8rem' }}>O CONTINÚA CON</span>
                                    </div>
                                    <button type="button" onClick={handleGoogleAuth} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
                                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" alt="Google" />
                                        Google
                                    </button>
                                </form>

                                <div style={{ marginTop: '32px', textAlign: 'center', color: '#6b7280', fontSize: '0.95rem' }}>
                                    {isLogin ? (
                                        <>¿No tienes una cuenta? <span onClick={() => setIsLogin(false)} style={{ color: '#00bcd4', fontWeight: '700', cursor: 'pointer' }}>Regístrate</span></>
                                    ) : (
                                        <>¿Ya tienes cuenta? <span onClick={() => setIsLogin(true)} style={{ color: '#00bcd4', fontWeight: '700', cursor: 'pointer' }}>Inicia sesión</span></>
                                    )}
                                </div>
                            </div>

                            {/* Info Column */}
                            <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '40px', paddingTop: '20px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '16px' }}>Todo lo que necesitas en un solo lugar.</h3>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {[
                                            { title: 'Gestión de Canciones Cloud', info: 'Accede a tus multipistas desde cualquier dispositivo.', icon: <CheckCircle2 size={22} color="#00bcd4" /> },
                                            { title: 'App para Móvil y Web', icon: <CheckCircle2 size={22} color="#00bcd4" /> },
                                            { title: 'Letras y Cifrados Integrados', icon: <CheckCircle2 size={22} color="#00bcd4" /> }
                                        ].map((item, i) => (
                                            <li key={i} style={{ display: 'flex', gap: '14px' }}>
                                                <div style={{ flexShrink: 0, marginTop: '2px' }}>{item.icon}</div>
                                                <div>
                                                    <div style={{ fontWeight: '700', fontSize: '1.05rem' }}>{item.title}</div>
                                                    {item.info && <div style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '4px' }}>{item.info}</div>}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '24px', borderRadius: '12px' }}>
                                    <p style={{ margin: 0, color: '#0f766e', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                        <strong>¿Sabías que?</strong> Miles de músicos ya usan Lugo Stage para simplificar sus procesos creativos. ¡Únete a la revolución!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* CREDITS SECTION: MUSO.AI */}
            <section id="creditos" style={{ padding: '80px 40px', background: '#000000', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '30px', display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }}></span>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '2px', color: 'white', textTransform: 'uppercase' }}>Créditos Verificados</span>
                    </div>
                    <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: '900', color: 'white', marginBottom: '20px', letterSpacing: '-1px' }}>TRAYECTORIA PROFESIONAL</h2>
                    <p style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
                        Consulta mi historial completo de créditos en producciones, ingeniería de sonido y colaboraciones con artistas internacionales a través de Muso.ai.
                    </p>
                    <button 
                        onClick={() => window.open('https://credits.muso.ai/profile/816a8ebd-5537-4c14-bc2e-4283b52ffbcc', '_blank')}
                        style={{ 
                            padding: '18px 45px', 
                            background: '#FFFFFF', 
                            color: '#000000', 
                            border: 'none', 
                            borderRadius: '50px', 
                            fontSize: '0.95rem', 
                            fontWeight: '900', 
                            letterSpacing: '1px', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px', 
                            margin: '0 auto',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(255,255,255,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        VER CREDITOS EN MUSO.AI <ExternalLink size={18} />
                    </button>
                    <div style={{ marginTop: '50px', opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: '900', color: 'white', letterSpacing: '3px' }}>MUSO<span style={{ color: '#94a3b8' }}>.AI</span></span>
                    </div>
                </div>
            </section>

            {/* CONTACT SECTION */}
            <section id="contacto" style={{ padding: '100px 20px', background: 'linear-gradient(to bottom, #000, #020617)' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '80px 40px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <h2 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '20px' }}>¿LISTO PARA EMPEZAR?</h2>
                    <p style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '40px' }}>
                        Transformemos tu idea en un sonido profesional. Contáctame directamente para hablar de tu proyecto.
                    </p>
                    <button 
                        onClick={() => window.open('https://wa.me/5215519805954', '_blank')} 
                        className="btn-teal" 
                        style={{ padding: '20px 50px', fontSize: '1.2rem', background: '#25D366', border: 'none', display: 'flex', alignItems: 'center', gap: '15px', margin: '0 auto', cursor: 'pointer', borderRadius: '12px', fontWeight: '900', color: 'white' }}
                    >
                        <span style={{ fontSize: '1.5rem' }}>💬</span> Hablar por WhatsApp
                    </button>
                    <div style={{ marginTop: '30px', color: '#64748b', fontSize: '0.9rem' }}>
                        Servicios personalizados para artistas y bandas.
                    </div>
                </div>
            </section>
            <Footer />

            {/* MODAL DE OPCIONES DE COMPRA (Estilo Secuencias.com) */}
            {showOptionsModal && selectedSongForOptions && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#020617', width: '100%', maxWidth: '550px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', animation: 'slideUp 0.3s ease-out' }}>
                        <div style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <img src={selectedSongForOptions.coverUrl || '/studio_placeholder.png'} style={{ width: '55px', height: '55px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} onError={e => e.target.src='/hero_banner_studio.png'} />
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: 'white' }}>{selectedSongForOptions.name}</h3>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>{selectedSongForOptions.artist}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowOptionsModal(false)} style={{ background: '#1e293b', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                        </div>

                        <div style={{ padding: '30px' }}>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '20px', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>Formatos Disponibles:</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {[
                                    { id: 'wav', name: 'Multitrack (Secuencia)', desc: 'Archivos WAV individuales de alta calidad.', price: pricing.wavPrice, format: 'WAV/ZIP', icon: <Layers size={20} /> },
                                    { id: 'stems', name: 'CustomMix (Stems)', desc: 'Grupos de instrumentos (Drums, Bass, Guitarras, etc).', price: pricing.stemsPrice, format: 'WAV Stems', icon: <Music2 size={20} /> },
                                    { id: 'mp3', name: 'Pista de Acompañamiento', desc: 'Versión MP3 lista para cantar sin voz principal.', price: pricing.mp3Price, format: 'MP3 High Quality', icon: <Music size={20} /> }
                                ].map((option) => (
                                    <div 
                                        key={option.id}
                                        onClick={() => addToCart(selectedSongForOptions, option)}
                                        style={{ 
                                            background: 'rgba(255,255,255,0.03)', 
                                            padding: '20px', 
                                            borderRadius: '18px', 
                                            border: '1px solid rgba(255,255,255,0.08)', 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'scale(1)'; }}
                                    >
                                        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', boxShadow: '0 4px 12px rgba(255,255,255,0.1)' }}>{option.icon}</div>
                                            <div>
                                                <div style={{ fontWeight: '900', fontSize: '1rem', color: 'white' }}>{option.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>{option.desc}</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.3rem', fontWeight: '900', color: 'white' }}>${option.price.toFixed(2)}</div>
                                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '800', letterSpacing: '1px' }}>USD</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: '25px', background: 'rgba(255,255,255,0.02)', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569', fontWeight: '600' }}>Acceso instantáneo después del pago mediante PayPal.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

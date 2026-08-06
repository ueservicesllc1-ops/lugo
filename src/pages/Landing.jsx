import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Search, ShoppingCart, Play, CheckCircle2, Menu, X, ArrowRight, User, KeyRound, Timer, Layers, Music, Music2, Disc, Globe, Camera, ChevronLeft, ChevronRight, Instagram, Youtube, ExternalLink } from 'lucide-react';
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
    const [pricing, setPricing] = useState({ wavPrice: 29.00, stemsPrice: 15.00, mp3Price: 9.00, wavTrackPrice: 9.00 });
    const [selectedMixOption, setSelectedMixOption] = useState('wav'); // wav | stems | custom | wav_track | mp3 | single_wav | single_mp3
    const [playingSimpleTrack, setPlayingSimpleTrack] = useState(null);
    const simpleAudioRef = React.useRef(null);

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
            const variantId = variant?.id 
                ? `${song.id}_${variant.id}` 
                : `${song.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

            const itemToAdd = {
                cartId: variantId,
                id: song.id,
                name: song.name,
                artist: song.artist,
                coverUrl: song.coverUrl,
                price: variant ? variant.price : (song.price || 49.00),
                variantName: variant ? variant.name : (song.isMultitrack ? 'Multitrack (Secuencia)' : 'Pista Instrumental'),
                format: variant ? variant.format : (song.isMultitrack ? 'WAV/ZIP' : 'MP3'),
                meta: variant?.meta || null
            };

            const newCart = [...prev, itemToAdd];
            localStorage.setItem('lugo_cart', JSON.stringify(newCart));
            return newCart;
        });

        const msg = variant 
            ? `¡${song.name} (${variant.name}) añadida!` 
            : `¡${song.name} añadida al carrito!`;

        setToast(msg);
        setTimeout(() => setToast(null), 3000);
        setShowOptionsModal(false);
    };

    const handleBuyClick = (song) => {
        setSelectedSongForOptions(song);
        setShowOptionsModal(true);
    };

    const toggleSimplePlay = (song) => {
        if (playingSimpleTrack?.id === song.id) {
            simpleAudioRef.current.pause();
            setPlayingSimpleTrack(null);
        } else {
            setPlayingSimpleTrack(song);
            setTimeout(() => {
                if (simpleAudioRef.current) {
                    simpleAudioRef.current.play().catch(e => console.error("Playback error", e));
                }
            }, 50);
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
                    const beats = sorted.filter(s => s.isSingle);
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

    const getProxyUrl = (url) => {
        if (!url) return '';
        const cleanUrl = String(url).split(',')[0].trim();
        if (cleanUrl.startsWith('/') || cleanUrl.includes('localhost') || cleanUrl.startsWith('blob:')) return cleanUrl;
        
        // Forzamos el uso del proxy de producción (Railway) incluso en local,
        // ya que el internet local del usuario bloquea Backblaze B2.
        const baseProxy = 'https://mixernew-production.up.railway.app';
        return `${baseProxy}/api/download?url=${encodeURIComponent(cleanUrl)}`;
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



            const tracksToLoad = rawTracks.map(t => ({ ...t, proxyUrl: getProxyUrl(t.url) }));
            setPreviewTracks(tracksToLoad.map(t => ({ id: t.id, name: t.name, muted: false, solo: false, volume: 0.8, pan: 0, selected: true })));

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

                const stopTime = useClips ? 80 : 80; // 60s limit from start at 20s
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

    const handleTrackSelectToggle = (id) => {
        setPreviewTracks(prev => prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t));
    };

    const togglePreviewPlayback = async () => {
        if (!previewEngineRef.current) return;
        await previewEngineRef.current.init();
        if (isPreviewPlaying) {
            previewEngineRef.current.pause();
            setIsPreviewPlaying(false);
        } else {
            const useClips = previewSong?.tracks?.some(t => t.previewUrl && t.previewUrl !== t.url);
            if (previewProgress >= 75) {
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

            {/* MODAL DE REPRODUCTOR SIMPLE */}
            {playingSimpleTrack && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                    zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px', animation: 'fadeIn 0.3s ease-out'
                }} onClick={() => setPlayingSimpleTrack(null)}>
                    <div 
                        style={{
                            background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '24px', padding: '30px', width: '100%', maxWidth: '400px',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
                            position: 'relative'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setPlayingSimpleTrack(null)} 
                            style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <X size={18}/>
                        </button>

                        <div style={{ position: 'relative', width: '200px', height: '200px', marginBottom: '10px' }}>
                            <img 
                                src={getProxyUrl(playingSimpleTrack.coverUrl) || 'https://juniorlugoproducciones.my.canva.site/_assets/media/86c9224aafa4cc886d9b45995298444f.jpg'} 
                                style={{ width: '100%', height: '100%', borderRadius: '20px', objectFit: 'cover', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
                            />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.8), transparent)', borderRadius: '20px' }}></div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: '900', margin: '0 0 5px' }}>{playingSimpleTrack.name}</h3>
                            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0, fontWeight: '600' }}>{playingSimpleTrack.artist}</p>
                        </div>

                        <audio 
                            ref={simpleAudioRef} 
                            src={getProxyUrl(playingSimpleTrack.mp3Url || playingSimpleTrack.demoUrl || playingSimpleTrack.audioUrl)} 
                            controls 
                            autoPlay 
                            style={{ width: '100%', height: '40px', marginTop: '10px' }} 
                            onTimeUpdate={(e) => {
                                if (e.target.currentTime >= 60) {
                                    e.target.pause();
                                    e.target.currentTime = 0;
                                }
                            }}
                            onEnded={(e) => {
                                e.target.currentTime = 0;
                            }}
                        />

                        <p style={{ color: '#00bcd4', fontSize: '0.75rem', fontWeight: '800', textAlign: 'center', margin: '5px 0 0 0' }}>
                            Nota: La muestra de audio dura 60 segundos.
                        </p>

                        <button 
                            onClick={() => { handleBuyClick(playingSimpleTrack); setPlayingSimpleTrack(null); }}
                            style={{ 
                                width: '100%', padding: '14px', borderRadius: '12px', background: '#00A3FF', 
                                border: 'none', color: 'black', fontWeight: '900', fontSize: '0.9rem', 
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                marginTop: '10px'
                            }}
                        >
                            <ShoppingCart size={18} /> COMPRAR ESTE BEAT
                        </button>
                    </div>
                </div>
            )}

            <style key="local-styles">{`
                @keyframes slideUp {
                    from { transform: translate(-50%, 50px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
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
                            { label: 'Tienda', action: () => navigate('/store') },
                            { label: 'Academia', action: () => navigate('/academy') },
                            { label: 'Trayectoria', action: () => document.getElementById('creditos')?.scrollIntoView({ behavior: 'smooth' }) },
                            { label: 'Contacto', action: () => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' }) },
                        ].map(item => (
                            <span
                                key={item.label}
                                onClick={item.action}
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
            </nav>
              {/* HERO SECTION - PREMIUM CINEMATIC EXPERIENCE */}
             <header style={{
                 position: 'relative',
                 minHeight: '85vh',
                 display: 'flex',
                 alignItems: 'center',
                 padding: '0 60px',
                 overflow: 'hidden',
                 backgroundColor: '#020617'
             }}>
                 {/* IMAGEN HERO: De fondo en toda la pantalla con baja opacidad sin degradado a negro */}
                 <div style={{ 
                     position: 'absolute', 
                     inset: 0,
                     zIndex: 1,
                     pointerEvents: 'none',
                     opacity: 0.15
                 }}>
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

                 {/* CONTENEDOR DE TEXTO: Centrado, minimalista y moderno */}
                 <div style={{ 
                     display: 'flex', 
                     width: '100%', 
                     maxWidth: '1400px', 
                     margin: '0 auto', 
                     alignItems: 'center', 
                     justifyContent: 'center',
                     position: 'relative', 
                     zIndex: 10,
                     padding: '0 5%'
                 }}>
                     <div style={{ flex: 1, textAlign: 'center', maxWidth: '650px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                         <div style={{ marginBottom: '10px', animation: 'fadeInDown 1s ease-out' }}>
                             <img 
                                 src="/logo.png" 
                                 alt="Logo" 
                                 style={{ 
                                     height: 'clamp(200px, 35vw, 400px)', 
                                     objectFit: 'contain', 
                                     animation: 'fadeInDown 1s ease-out'
                                 }} 
                             />
                         </div>

                         <p style={{
                             fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
                             color: 'rgba(255,255,255,0.9)',
                             maxWidth: '550px',
                             lineHeight: '1.5',
                             marginBottom: '30px',
                             fontWeight: '300',
                             letterSpacing: '0.5px',
                             animation: 'fadeIn 1.5s ease-out',
                             paddingLeft: 0
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
                             <button
                                 onClick={() => navigate('/academy')}
                                 style={{
                                     padding: '14px 40px',
                                     background: 'transparent',
                                     border: '1px solid #FFFFFF',
                                     borderRadius: '6px',
                                     color: '#FFFFFF',
                                     fontSize: '0.85rem',
                                     fontWeight: '800',
                                     cursor: 'pointer',
                                     transition: 'all 0.3s ease',
                                     textTransform: 'uppercase'
                                 }}
                                 onMouseOver={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#000000'; }}
                                 onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FFFFFF'; }}
                             >
                                 Academia
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
                                <img src={getProxyUrl(selectedSongForOptions.coverUrl) || '/studio_placeholder.png'} style={{ width: '55px', height: '55px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} onError={e => e.target.src='/hero_banner_studio.png'} />
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
                                {((selectedSongForOptions.isSingle) ? [
                                    { id: 'single_wav', name: 'Licencia Premium (WAV)', desc: 'Versión WAV de alta fidelidad para uso profesional.', price: selectedSongForOptions.priceWav || selectedSongForOptions.price || 0, format: 'WAV', icon: <Music size={20} /> },
                                    { id: 'single_mp3', name: 'Licencia Básica (MP3)', desc: 'Versión MP3 lista para maquetar o uso personal.', price: selectedSongForOptions.priceMp3 || 0, format: 'MP3', icon: <Music size={20} /> }
                                ] : [
                                    { id: 'wav', name: 'Multitrack (Secuencia)', desc: 'Archivos WAV individuales de alta calidad.', price: parseFloat(selectedSongForOptions.price) || 0, format: 'WAV/ZIP', icon: <Layers size={20} /> },
                                    { id: 'stems', name: 'CustomMix (Stems)', desc: 'Grupos de instrumentos (Drums, Bass, Guitarras, etc).', price: pricing.stemsPrice, format: 'WAV Stems', icon: <Music2 size={20} /> },
                                    { id: 'wav_track', name: 'Acompañamiento (WAV)', desc: 'Versión WAV de alta fidelidad sin voz principal.', price: pricing.wavTrackPrice || 15.00, format: 'WAV High Quality', icon: <Music size={20} /> },
                                    { id: 'mp3', name: 'Acompañamiento (MP3)', desc: 'Versión MP3 lista para cantar sin voz principal.', price: pricing.mp3Price, format: 'MP3 High Quality', icon: <Music size={20} /> }
                                ]).map((option) => (
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
                                            <div style={{ fontSize: '1.3rem', fontWeight: '900', color: 'white' }}>${Number(option.price).toFixed(2)}</div>
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

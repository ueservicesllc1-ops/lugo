import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Search, ShoppingCart, Play, CheckCircle2, Menu, X, ArrowRight, User, KeyRound, Timer, Layers, Music, Music2, Disc, Globe, Camera, ChevronLeft, ChevronRight, Instagram, Youtube, ExternalLink } from 'lucide-react';
import Footer from '../components/Footer';
import { HorizontalMixer } from '../components/HorizontalMixer';
import Navbar from '../components/Navbar';

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
    const [hoveredNav, setHoveredNav] = useState(null);
    const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
    const [latestApp, setLatestApp] = useState(null);
    const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState(null);
    const [galleryPhotos, setGalleryPhotos] = useState([]);
    const [portfolioVideos, setPortfolioVideos] = useState([]);
    const [socials, setSocials] = useState({ instagram: '', youtube: '', tiktok: '', spotify: '' });
    const [multitracksForSale, setMultitracksForSale] = useState([]);
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [selectedSongForOptions, setSelectedSongForOptions] = useState(null);
    const [pricing, setPricing] = useState({ wavPrice: 580.00, stemsPrice: 300.00, mp3Price: 180.00, wavTrackPrice: 180.00 });
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



            <Navbar cartCount={cart.length} />
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
                             objectFit: 'cover',
                             objectPosition: 'right center'
                         }}
                     />
                 </div>

                 {/* CONTENEDOR DE TEXTO: Alineado a la izquierda, minimalista y moderno */}
                 <div style={{ 
                     display: 'flex', 
                     width: '100%', 
                     maxWidth: '1400px', 
                     margin: '0 auto', 
                     alignItems: 'center', 
                     justifyContent: 'flex-start',
                     position: 'relative', 
                     zIndex: 10,
                     padding: '0 5%'
                 }}>
                     <div style={{ flex: 1, textAlign: 'left', maxWidth: '650px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                         <div style={{ marginBottom: '10px', animation: 'fadeInDown 1s ease-out' }}>
                             <img 
                                 src="/logo.png" 
                                 alt="Logo" 
                                 style={{ 
                                     height: 'clamp(150px, 25vw, 300px)', 
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
                                    { id: 'wav_track', name: 'Acompañamiento (WAV)', desc: 'Versión WAV de alta fidelidad sin voz principal.', price: pricing.wavTrackPrice || 180.00, format: 'WAV High Quality', icon: <Music size={20} /> },
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
                                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '800', letterSpacing: '1px' }}>MXN</div>
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

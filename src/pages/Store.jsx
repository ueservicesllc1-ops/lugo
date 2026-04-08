import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Search, ShoppingCart, Play, X, ArrowLeft, Music2, Globe, LogOut } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import Footer from '../components/Footer';
import { HorizontalMixer } from '../components/HorizontalMixer';

const SongCard = ({ song, onPreview, onBuy, navigate }) => {
    const [realSellerName, setRealSellerName] = useState(song.sellerName || 'Vendedor Lugo');

    useEffect(() => {
        let isMounted = true;
        if (!song || !song.userId) {
            const name = song?.sellerName || song?.artist || 'Vendedor Lugo';
            Promise.resolve().then(() => {
                if (isMounted) setRealSellerName(prev => prev !== name ? name : prev);
            });
            return;
        }

        if (!song.sellerName || song.sellerName === 'Vendedor Lugo') {
            const fetchName = async () => {
                try {
                    const userSnap = await getDoc(doc(db, 'users', song.userId));
                    if (isMounted && userSnap.exists()) {
                        const userData = userSnap.data();
                        const fullName = userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : userData.displayName;
                        if (isMounted && fullName) {
                            Promise.resolve().then(() => {
                                setRealSellerName(fullName);
                            });
                        }
                    }
                } catch (_e) {
                    console.error("Error fetching seller name:", _e);
                }
            };
            fetchName();
        } else {
            const name = song.sellerName;
            Promise.resolve().then(() => {
                if (isMounted) setRealSellerName(prev => prev !== name ? name : prev);
            });
        }
        return () => { isMounted = false; };
    }, [song]);

    const previewUrl = song.tracks?.find(t => t.name === '__PreviewMix')?.previewUrl || 
                      song.tracks?.find(t => t.name === '__PreviewMix')?.url ||
                      song.tracks?.[0]?.previewUrl ||
                      song.audioUrl;

    return (
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', transition: 'transform 0.2s', cursor: 'pointer', height: '100%', position: 'relative' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ height: '140px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }} className="group">
                {song.coverUrl ? (
                    <img src={song.coverUrl} alt={song.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'filter 0.3s' }} className="song-cover" />
                ) : (
                    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
                        <img src="/generic_cover.png" alt="Generic Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.4)' }}>
                            <Music2 size={32} color="white" style={{ opacity: 0.5 }} />
                        </div>
                    </div>
                )}
                
                {/* Play Button Overlay */}
                {previewUrl && (
                    <div 
                        onClick={(e) => { e.stopPropagation(); onPreview(); }}
                        style={{ 
                            position: 'absolute', 
                            inset: 0, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            transition: 'all 0.3s',
                            opacity: 0
                        }} 
                        className="play-overlay"
                    >
                        <div style={{ 
                            width: '44px', 
                            height: '44px', 
                            borderRadius: '50%', 
                            background: '#00A3FF', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: '#000',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                        }}>
                            <Play size={20} fill="currentColor" style={{ marginLeft: '3px' }} />
                        </div>
                    </div>
                )}

                <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '800', backdropFilter: 'blur(4px)', zIndex: 5 }}>{song.tempo ? `${song.tempo} BPM` : 'BPM variable'}</div>
            </div>
            
            <style>{`
                .group:hover .song-cover { filter: brightness(0.4); }
                .group:hover .play-overlay { opacity: 1 !important; background: rgba(0,0,0,0.3) !important; }
            `}</style>

            <div style={{ padding: '12px' }}>
                <h3 style={{ margin: '0 0 2px 0', fontSize: '0.9rem', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.name}</h3>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.artist}</div>
                <div
                    onClick={(e) => { e.stopPropagation(); navigate(`/seller/${song.userId}`); }}
                    style={{ color: '#00A3FF', fontSize: '0.7rem', marginBottom: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }}
                >
                    {realSellerName}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>${song.price || '9.99'}</div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onBuy(); }}
                        style={{ background: '#00A3FF', border: 'none', color: '#fff', padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                    >
                        Agregar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function Store() {
    const navigate = useNavigate();
    const { t, language, toggleLanguage } = useTranslation();
    const location = useLocation();
    const [storeSongs, setStoreSongs] = useState([]);
    
    const [activeCategory, setActiveCategory] = useState('multitrack');
    
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const type = params.get('type');
        if (type) setActiveCategory(type);
    }, [location.search]);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [cart, setCart] = useState([]);
    const [toast, setToast] = useState(null); 
    
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [selectedSongForOptions, setSelectedSongForOptions] = useState(null);
    const [pricing, setPricing] = useState({ wavPrice: 29.00, stemsPrice: 15.00, mp3Price: 9.00 });
    const previewEngineRef = React.useRef(null);
    const [previewSong, setPreviewSong] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewTracks, setPreviewTracks] = useState([]);
    const [previewProgress, setPreviewProgress] = useState(0);
    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

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

            const validTracks = song.tracks?.filter(t => t.name !== '__PreviewMix') || [];
            const isUsingPreviewMixOnly = validTracks.length === 0;
            const useClips = isUsingPreviewMixOnly || validTracks.some(t => t.previewUrl && t.previewUrl !== t.url);
            
            const rawTracks = (validTracks.length > 0)
                ? validTracks.map(t => ({ id: t.id || Math.random().toString(), name: t.name || 'UNNAMED', url: (useClips ? t.previewUrl : t.url) || t.url }))
                : (song.tracks?.some(t => t.name === '__PreviewMix')
                    ? song.tracks?.filter(t => t.name === '__PreviewMix').map(t => ({ id: 'preview', name: 'DEMO CLIP', url: t.url || t.previewUrl }))
                    : (song.audioUrl ? [{ id: 'single', name: 'PISTA FULL', url: song.audioUrl }] : [])
                );

            const getProxyUrl = (url) => {
                if (!url) return '';
                if (url.startsWith('/') || url.includes('localhost')) return url;
                const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                const baseProxy = isLocal ? 'http://localhost:3001' : 'https://mixernew-production.up.railway.app';
                return `${baseProxy}/api/download?url=${encodeURIComponent(url)}`;
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
                } catch (e) { console.warn(`Failed track ${t.name}`, e); }
            }

            if (batch.length === 0) throw new Error("No tracks loaded");
            await audioEngine.addTracksBatch(batch);
            
            const startPos = useClips ? 0 : 20;
            await audioEngine.seek(startPos);
            await audioEngine.play();
            setIsPreviewPlaying(true);
            setPreviewLoading(false);

            audioEngine.onProgress = (p) => {
                const displayTime = useClips ? (20 + p) : p;
                setPreviewProgress(displayTime);
                if (displayTime >= 40) {
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
        setIsPreviewPlaying(false);
    };

    const togglePreviewPlayback = async () => {
        const engine = previewEngineRef.current;
        if (!engine) return;
        if (isPreviewPlaying) {
            await engine.pause();
            setIsPreviewPlaying(false);
        } else {
            await engine.play();
            setIsPreviewPlaying(true);
        }
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
        previewEngineRef.current?.setTrackPan(id, pan);
    };

    useEffect(() => {
        const savedCart = localStorage.getItem('lugo_cart');
        if (savedCart) {
            try { setCart(JSON.parse(savedCart)); } catch { setCart([]); }
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
            : `¡${song.name} agregada con éxito!`;

        setToast({ 
            message: msg, 
            song,
            type: 'success' 
        });
        setTimeout(() => setToast(null), 6000);
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
        const unsubAuth = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
        });

        getDoc(doc(db, 'settings', 'multitrack_pricing')).then(snap => {
            if (snap.exists()) setPricing(snap.data());
        });

        const q = query(
            collection(db, 'songs'), 
            where('forSale', '==', true)
        );
        
        const unsubSongs = onSnapshot(q, (snap) => {
            const songsList = [];
            snap.forEach(doc => {
                const data = doc.data();
                const isMT = data.isMultitrack === true || (Array.isArray(data.tracks) && data.tracks.length > 0);
                const isSingle = !isMT; 

                if (data.status === 'active' || data.status === 'pending_review' || data.status === 'pending') {
                    songsList.push({ 
                        id: doc.id, 
                        ...data, 
                        isMultitrack: isMT, 
                        isSingle: isSingle 
                    });
                }
            });
            
            const sorted = songsList.sort((a, b) => {
                const timeA = a.createdAt?.toMillis() || 0;
                const timeB = b.createdAt?.toMillis() || 0;
                return timeB - timeA;
            });
            setStoreSongs(sorted);
        });

        return () => { 
            unsubAuth(); 
            unsubSongs();
            import('../AudioEngine').then(({ audioEngine }) => {
                if (audioEngine.onProgress) audioEngine.onProgress = null;
            }).catch(() => {});
        };
    }, []);

    return (
        <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: '"Outfit", sans-serif' }}>

            {toast && (
                <div key="toast-notification" style={{
                    position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
                    background: '#1e293b', border: `1px solid ${toast.type === 'error' ? '#ef4444' : '#00A3FF'}`, color: 'white',
                    padding: '16px 28px', borderRadius: '24px', zIndex: 5000,
                    boxShadow: '0 20px 50px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: '20px',
                    animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: toast.type === 'error' ? '#ef4444' : 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {toast.type === 'error' ? <X size={20} color="white" /> : <ShoppingCart size={20} color="#00A3FF" />}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: '800', fontSize: '1rem', color: '#f8fafc' }}>{toast.message}</span>
                        {toast.type === 'success' && (
                            <div style={{ display: 'flex', gap: '15px', marginTop: '4px' }}>
                                <button 
                                    onClick={() => navigate('/checkout')} 
                                    style={{ background: '#00A3FF', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s' }}
                                >
                                    VER MI CARRITO
                                </button>
                                <button 
                                    onClick={() => setToast(null)} 
                                    style={{ background: 'transparent', color: '#94a3b8', border: 'none', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', padding: 0 }}
                                >
                                    SEGUIR COMPRANDO
                                </button>
                            </div>
                        )}
                    </div>

                    <button onClick={() => setToast(null)} style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', marginLeft: '10px' }}>
                        <X size={18} />
                    </button>
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from { transform: translate(-50%, 50px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `}</style>

            <nav style={{
                padding: window.innerWidth < 768 ? '10px 15px' : '15px 40px',
                background: '#0f172a',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                backdropFilter: 'blur(20px)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: window.innerWidth < 768 ? '10px' : '30px' }}>
                    <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: 'white', letterSpacing: '-1px' }}>JUNIOR<span style={{ color: '#00A3FF' }}>LUGO</span></h1>
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px', borderRadius: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.75rem' }}
                    >
                        <ArrowLeft size={14} /> <span className="hide-mobile">Volver</span>
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ position: 'relative' }} className="hide-mobile">
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px 8px 35px', borderRadius: '30px', width: '180px', fontSize: '0.85rem' }}
                        />
                        <Search size={14} style={{ position: 'absolute', top: '10px', left: '12px', color: '#64748b' }} />
                    </div>

                    <button 
                        onClick={toggleLanguage}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <Globe size={14} /> {language === 'es' ? 'EN' : 'ES'}
                    </button>

                    <button
                        onClick={() => navigate('/checkout')}
                        style={{ position: 'relative', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer' }}
                    >
                        <ShoppingCart size={18} />
                        {cart.length > 0 && <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#00A3FF', color: '#fff', fontSize: '0.65rem', fontWeight: '900', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f172a' }}>
                                {cart.length}
                            </span>
                        }
                    </button>

                    {currentUser && (
                        <div style={{ position: 'relative' }}>
                            <div
                                onClick={() => setShowDropdown(!showDropdown)}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '4px 4px 4px 10px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#e2e8f0' }} className="hide-mobile">{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#00A3FF,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.75rem' }}>
                                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                                </div>
                            </div>

                            {showDropdown && (
                                <div style={{ position: 'absolute', top: '42px', right: 0, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '180px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 2000 }}>
                                    <div
                                        onClick={() => navigate('/dashboard')}
                                        style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#e2e8f0', fontSize: '0.85rem', fontWeight: '600' }}
                                    >
                                        <Globe size={14} color="#94a3b8" /> {t('dashboard')}
                                    </div>
                                    <div
                                        onClick={() => auth.signOut()}
                                        style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#ef4444', fontSize: '0.85rem', fontWeight: '600' }}
                                    >
                                        <LogOut size={14} /> {t('logout')}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </nav>

            <header style={{ padding: window.innerWidth < 768 ? '30px 20px' : '60px 40px 30px', textAlign: 'center', background: 'radial-gradient(circle at center, rgba(139,92,246,0.1), transparent)' }}>
                <h1 style={{ fontSize: window.innerWidth < 768 ? '2.2rem' : '3.5rem', fontWeight: '900', marginBottom: '10px', lineHeight: 1.1 }}>
                    {activeCategory === 'multitrack' ? 'Tienda de Secuencias' : 'Venta de Pistas'}
                </h1>
                <p style={{ color: '#94a3b8', fontSize: window.innerWidth < 768 ? '1rem' : '1.2rem', maxWidth: '600px', margin: '0 auto 20px' }}>
                    {activeCategory === 'multitrack' 
                        ? 'Explora multitracks profesionales para Zion Stage.' 
                        : 'Encuentra pistas individuales y acompañamientos para tu ministerio.'}
                </p>
            </header>

            <style>{`
                .store-grid {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 15px;
                    padding: 20px 0;
                }
                @media (max-width: 1400px) {
                    .store-grid { grid-template-columns: repeat(5, 1fr); }
                }
                @media (max-width: 1100px) {
                    .store-grid { grid-template-columns: repeat(4, 1fr); }
                }
                @media (max-width: 900px) {
                    .store-grid { grid-template-columns: repeat(3, 1fr); }
                }
                @media (max-width: 650px) {
                    .store-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 450px) {
                    .store-grid { grid-template-columns: repeat(1, 1fr); }
                }
                .hide-mobile {
                    @media (max-width: 768px) {
                        display: none !important;
                    }
                }
            `}</style>

            <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                <div style={{ padding: '40px' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '30px' }}>{searchQuery ? 'Resultados de Búsqueda' : (activeCategory === 'multitrack' ? 'Catálogo de Secuencias' : 'Pistas Individuales')}</h2>
                    
                    <div className="store-grid">
                        {storeSongs
                            .filter(s => activeCategory === 'multitrack' ? s.isMultitrack : s.isSingle)
                            .filter(s => 
                                (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (s.artist || '').toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map(song => (
                                <SongCard 
                                    key={song.id} 
                                    song={song} 
                                    onPreview={() => openPreview(song)}
                                    onBuy={() => handleBuyClick(song)} 
                                    navigate={navigate} 
                                />
                            ))}
                    </div>

                    {storeSongs.filter(s => activeCategory === 'multitrack' ? s.isMultitrack : s.isSingle).length === 0 && (
                        <div style={{ textAlign: 'center', padding: '100px 0', color: '#64748b' }}>
                            <Music2 size={48} style={{ margin: '0 auto 20px', opacity: 0.2 }} />
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#94a3b8' }}>No hay resultados aquí</h3>
                            <p>Prueba con otra categoría o busca otro nombre.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* PREVIEW MODAL (Multitrack Mixer) */}
            {previewSong && (
                <div key="preview-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                    <div style={{ background: '#020617', width: '100%', maxWidth: '1300px', maxHeight: '95vh', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', overflowY: 'auto', boxShadow: '0 40px 80px rgba(0,0,0,0.8)', color: 'white', display: 'flex', flexDirection: 'column' }}>

                        <div style={{ padding: '14px 25px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(139,92,246,0.3)' }}>
                                    <img src={previewSong.coverUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: '#00A3FF' }}>{previewSong.name}</h3>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>PREVIEW</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={closePreview} style={{ background: '#1e293b', border: 'none', width: '32px', height: '32px', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}><X size={16} /></button>
                        </div>

                        <div style={{ padding: '20px 25px' }}>
                            {previewLoading ? (
                                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                                    <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139,92,246,0.1)', borderTopColor: '#00A3FF', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
                                    <p style={{ color: '#00A3FF', fontSize: '0.9rem', fontWeight: '900', letterSpacing: '1px' }}>INICIALIZANDO MOTOR...</p>
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
                                            style={{ background: '#00A3FF', border: 'none', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', cursor: 'pointer', boxShadow: '0 0 20px rgba(139,92,246,0.3)', transition: 'transform 0.2s' }}
                                        >
                                            {isPreviewPlaying ? <X size={24} color="black" /> : <Play size={24} fill="black" color="black" style={{ marginLeft: '3px' }} />}
                                        </button>

                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '900', letterSpacing: '0.5px' }}>PLAYBACK (20s-40s)</span>
                                                <span style={{ color: '#00A3FF', fontSize: '1rem', fontWeight: '900', fontFamily: 'monospace' }}>{previewProgress.toFixed(1)}s</span>
                                            </div>
                                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ width: `${Math.max(0, Math.min(100, ((previewProgress - 20) / 20) * 100))}%`, height: '100%', background: 'linear-gradient(to right, #00A3FF, #C084FC)', boxShadow: '0 0 10px rgba(139,92,246,0.4)', transition: 'width 0.1s linear' }}></div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                handleBuyClick(previewSong);
                                                closePreview();
                                            }}
                                            style={{ background: '#f1c40f', color: 'black', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            <ShoppingCart size={16} /> COMPRAR
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE OPCIONES DE COMPRA (Estilo Secuencias.com) */}
            {showOptionsModal && selectedSongForOptions && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#111827', width: '100%', maxWidth: '550px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                        <div style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <img src={selectedSongForOptions.coverUrl} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>{selectedSongForOptions.name}</h3>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>{selectedSongForOptions.artist}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowOptionsModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                        </div>

                        <div style={{ padding: '25px' }}>
                            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '20px', fontWeight: '600', letterSpacing: '0.5px' }}>SELECCIONA EL TIPO PRODUCTO:</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    { id: 'wav', name: 'Multitrack (Secuencia)', desc: 'Archivos WAV individuales para Zion Stage o DAW.', price: pricing.wavPrice, format: 'WAV/ZIP', icon: <Layers size={18} /> },
                                    { id: 'stems', name: 'CustomMix (Stems)', desc: 'Grupos de instrumentos (Drums, Bass, etc).', price: pricing.stemsPrice, format: 'WAV Stems', icon: <Music2 size={18} /> },
                                    { id: 'mp3', name: 'Pista de Acompañamiento', desc: 'Archivo MP3 de alta calidad sin voz principal.', price: pricing.mp3Price, format: 'MP3 High Quality', icon: <Music size={18} /> }
                                ].map((option) => (
                                    <div 
                                        key={option.id}
                                        onClick={() => addToCart(selectedSongForOptions, option)}
                                        style={{ 
                                            background: 'rgba(255,255,255,0.03)', 
                                            padding: '18px 20px', 
                                            borderRadius: '16px', 
                                            border: '1px solid rgba(255,255,255,0.08)', 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,163,255,0.08)'; e.currentTarget.style.borderColor = '#00A3FF'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                                    >
                                        <div style={{ display: 'flex', gap: '15px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A3FF' }}>{option.icon}</div>
                                            <div>
                                                <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>{option.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{option.desc}</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'white' }}>${option.price.toFixed(2)}</div>
                                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700' }}>USD</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: '25px', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#4b5563' }}>Todas las compras incluyen licencia de uso para presentaciones en vivo.</p>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}





import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ChevronLeft, X, Maximize2, Camera } from 'lucide-react';
import Footer from '../components/Footer';

export default function Gallery() {
    const navigate = useNavigate();
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    const getProxyUrl = (url) => {
        if (!url) return '';
        const cleanUrl = String(url).split(',')[0].trim();
        if (cleanUrl.startsWith('/') || cleanUrl.includes('localhost')) return cleanUrl;
        
        const baseProxy = 'https://mixernew-production.up.railway.app';
        return `${baseProxy}/api/download?url=${encodeURIComponent(cleanUrl)}`;
    };

    useEffect(() => {
        const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snap) => {
            const items = [];
            snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
            setPhotos(items);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Placeholder content if empty
    const PLACEHOLDERS = [
        { url: 'https://juniorlugoproducciones.my.canva.site/_assets/media/304b1a4d184946867ea9137eb1bb2a6f.png', caption: 'Salsa Fest. Veracruz. 2023.' },
        { url: 'https://juniorlugoproducciones.my.canva.site/_assets/media/7de6e9846afef951695af2f65873f3c0.png', caption: 'Estadio El Campín. Bogotá. 2024.' },
        { url: 'https://juniorlugoproducciones.my.canva.site/_assets/media/86c9224aafa4cc886d9b45995298444f.jpg', caption: 'Estudio de Producción' }
    ];

    const displayPhotos = photos.length > 0 ? photos : PLACEHOLDERS;

    return (
        <div style={{ backgroundColor: '#020617', minHeight: '110vh', color: 'white', fontFamily: '"Outfit", sans-serif' }}>
            {/* Header / Nav Back */}
            <nav style={{ padding: '30px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
                <button 
                    onClick={() => navigate('/')}
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '800' }}
                >
                    <ChevronLeft size={18} /> VOLVER AL INICIO
                </button>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase' }}>GALERÍA VISUAL</h1>
                    {photos.length > 0 && <span style={{ fontSize: '0.65rem', color: '#8B5CF6', letterSpacing: '2px', fontWeight: '800' }}>MOSTRANDO CONTENIDO EXCLUSIVO</span>}
                </div>
                <div style={{ width: '100px' }}></div>
            </nav>

            {/* Grid Gallery */}
            <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '80px 40px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <div className="loader" style={{ fontSize: '1.2rem', color: '#8B5CF6', fontWeight: '800' }}>SINCRONIZANDO GALERÍA...</div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                        {displayPhotos.map((photo, i) => (
                            <div 
                                key={i}
                                onClick={() => setSelectedPhoto(photo)}
                                style={{ 
                                    position: 'relative', 
                                    borderRadius: '16px', 
                                    overflow: 'hidden', 
                                    cursor: 'pointer', 
                                    aspectRatio: '16/10',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    transition: 'all 0.4s ease'
                                }}
                                className="gallery-grid-item"
                            >
                                <img 
                                    src={getProxyUrl(photo.url)} 
                                    alt={photo.caption} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }} 
                                />
                                <div style={{ 
                                    position: 'absolute', inset: 0, 
                                    background: 'linear-gradient(to top, rgba(139, 92, 246, 0.6), transparent)', 
                                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', 
                                    padding: '20px',
                                    opacity: 0, transition: 'opacity 0.3s' 
                                }} className="overlay">
                                    <div style={{ textAlign: 'center' }}>
                                        <Maximize2 size={32} color="white" style={{ marginBottom: '10px' }} />
                                        <p style={{ color: 'white', fontWeight: '900', fontSize: '0.9rem', textTransform: 'uppercase' }}>{photo.caption}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Lightbox Modal */}
            {selectedPhoto && (
                <div 
                    onClick={() => setSelectedPhoto(null)}
                    style={{ 
                        position: 'fixed', inset: 0, 
                        backgroundColor: 'rgba(0,0,0,0.95)', 
                        zIndex: 2000, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        padding: '40px' 
                    }}
                >
                    <button style={{ position: 'absolute', top: '30px', right: '40px', background: 'white', color: 'black', border: 'none', borderRadius: '50%', width: '50px', height: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={28} />
                    </button>
                    <div style={{ maxWidth: '1200px', maxHeight: '80%', textAlign: 'center' }}>
                        <img 
                            src={getProxyUrl(selectedPhoto.url)} 
                            alt={selectedPhoto.caption} 
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '75vh', 
                                borderRadius: '20px', 
                                border: '4px solid rgba(139, 92, 246, 0.3)',
                                boxShadow: '0 50px 100px rgba(0,0,0,0.9)' 
                            }} 
                        />
                        <h3 style={{ marginTop: '30px', fontSize: '1.8rem', fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase' }}>{selectedPhoto.caption}</h3>
                    </div>
                </div>
            )}

            <style>{`
                .gallery-grid-item:hover { transform: translateY(-10px); z-index: 2; box-shadow: 0 30px 60px rgba(139, 92, 246, 0.2); border-color: rgba(139, 92, 246, 0.5); }
                .gallery-grid-item:hover .overlay { opacity: 1 !important; }
                .gallery-grid-item:hover img { transform: scale(1.1); }
            `}</style>

            <Footer />
        </div>
    );
}

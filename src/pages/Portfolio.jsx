import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ChevronLeft, Video, ExternalLink } from 'lucide-react';
import Footer from '../components/Footer';

export default function Portfolio() {
    const navigate = useNavigate();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'portfolio'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snap) => {
            const items = [];
            snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
            setVideos(items);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const displayVideos = videos;

    return (
        <div style={{ backgroundColor: '#020617', minHeight: '110vh', color: 'white', fontFamily: '"Outfit", sans-serif' }}>
            {/* Header / Nav Back */}
            <nav style={{ padding: '30px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
                <button 
                    onClick={() => navigate('/')}
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '800' }}
                >
                    <ChevronLeft size={18} /> INICIO
                </button>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase' }}>PORTAFOLIO DE PRODUCCIONES</h1>
                    {videos.length > 0 && <span style={{ fontSize: '0.65rem', color: '#8B5CF6', letterSpacing: '2px', fontWeight: '800' }}>CATÁLOGO COMPLETO</span>}
                </div>
                <div style={{ width: '100px' }}></div>
            </nav>

            <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '80px 40px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <div style={{ fontSize: '1.2rem', color: '#8B5CF6', fontWeight: '800', letterSpacing: '2px' }}>CARGANDO PRODUCCIONES...</div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '30px' }}>
                        {displayVideos.map((v, i) => (
                            <div key={i} style={{ 
                                background: '#0a0f1e', 
                                borderRadius: '16px', 
                                overflow: 'hidden', 
                                border: '1px solid rgba(255,255,255,0.05)',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                                transition: 'transform 0.3s'
                            }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                <div style={{ aspectRatio: '16/9', background: '#000', position: 'relative' }}>
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${v.videoId}?rel=0&modestbranding=1`}
                                        title={v.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        style={{ display: 'block' }}
                                    ></iframe>
                                    <div style={{ position: 'absolute', top: '15px', left: '15px', background: '#8B5CF6', padding: '4px 12px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '900', zIndex: 10 }}>{v.genre}</div>
                                </div>
                                <div style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', margin: '0 0 8px 0', fontWeight: '800' }}>{v.title}</h3>
                                        <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, letterSpacing: '0.5px' }}>Producción Junior Lugo</p>
                                    </div>
                                    <a href={`https://youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noreferrer" style={{ color: '#8B5CF6', transition: 'transform 0.2s' }}>
                                        <ExternalLink size={24} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

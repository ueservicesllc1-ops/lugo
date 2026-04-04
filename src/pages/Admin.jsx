import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
    collection, 
    onSnapshot, 
    doc, 
    deleteDoc, 
    addDoc, 
    serverTimestamp, 
    query, 
    orderBy,
    setDoc,
    getDoc,
    updateDoc
} from 'firebase/firestore';
import { 
    ShieldCheck, 
    Music, 
    Image as ImageIcon, 
    Plus, 
    Trash2, 
    LogOut,
    Video,
    ExternalLink,
    Upload,
    FileText,
    CheckCircle2,
    Share2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('products');
    
    // Data states
    const [products, setProducts] = useState([]);
    const [gallery, setGallery] = useState([]);
    const [videos, setVideos] = useState([]);
    const [socials, setSocials] = useState({ instagram: '', youtube: '', tiktok: '', spotify: '' });

    // UI States
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [isAddingPhoto, setIsAddingPhoto] = useState(false);
    const [isAddingVideo, setIsAddingVideo] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form states
    const [newProduct, setNewProduct] = useState({ name: '', artist: '', price: '', coverFile: null, audioFile: null });
    const [newPhoto, setNewPhoto] = useState({ caption: '', file: null });
    const [newVideo, setNewVideo] = useState({ title: '', genre: '', youtubeUrl: '' });

    // Previews
    const [previews, setPreviews] = useState({ photo: null, cover: null });

    // Check Authentication
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user && (user.email === 'ueservicesllc1@gmail.com' || user.email === 'juniorlugo@admin.com')) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Edit States
    const [editingVideo, setEditingVideo] = useState(null);
    const [isEditingVideo, setIsEditingVideo] = useState(false);

    // Fetch Data
    useEffect(() => {
        if (!isAdmin) return;

        const unsubProducts = onSnapshot(query(collection(db, 'songs'), orderBy('createdAt', 'desc')), (snap) => {
            setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubGallery = onSnapshot(query(collection(db, 'gallery'), orderBy('createdAt', 'desc')), (snap) => {
            setGallery(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubVideos = onSnapshot(query(collection(db, 'portfolio'), orderBy('createdAt', 'desc')), (snap) => {
            setVideos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const fetchSocials = async () => {
            const snap = await getDoc(doc(db, 'settings', 'socials'));
            if (snap.exists()) setSocials(snap.data());
        };
        fetchSocials();

        return () => { unsubProducts(); unsubGallery(); unsubVideos(); };
    }, [isAdmin]);

    const handleLogout = () => { auth.signOut(); navigate('/'); };

    const extractYoutubeId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const uploadToB2 = async (file) => {
        if (!file) return null;
        const formData = new FormData();
        const timestamp = Date.now();
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const b2FileName = `${timestamp}_${cleanName}`;
        
        formData.append('audioFile', file);
        formData.append('fileName', b2FileName);
        
        const res = await fetch('http://localhost:3001/api/upload', { 
            method: 'POST', 
            body: formData 
        });
        
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Error subiendo archivo");
        }
        const data = await res.json();
        return data.url;
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            const coverUrl = newProduct.coverFile ? await uploadToB2(newProduct.coverFile) : '';
            const audioUrl = newProduct.audioFile ? await uploadToB2(newProduct.audioFile) : '';
            
            await addDoc(collection(db, 'songs'), {
                name: newProduct.name,
                artist: newProduct.artist,
                price: parseFloat(newProduct.price) || 0,
                coverUrl,
                audioUrl,
                forSale: true,
                status: 'active',
                createdAt: serverTimestamp()
            });
            setIsAddingProduct(false);
            setNewProduct({ name: '', artist: '', price: '', coverFile: null, audioFile: null });
            setPreviews({ ...previews, cover: null });
        } catch (err) { alert(err.message); } finally { setUploading(false); }
    };
    
    const handleAddPhoto = async (e) => {
        e.preventDefault();
        if (!newPhoto.file) return;
        setUploading(true);
        try {
            const url = await uploadToB2(newPhoto.file);
            await addDoc(collection(db, 'gallery'), {
                url,
                caption: newPhoto.caption,
                createdAt: serverTimestamp()
            });
            setIsAddingPhoto(false);
            setNewPhoto({ caption: '', file: null });
            setPreviews({ ...previews, photo: null });
        } catch (err) { alert(err.message); } finally { setUploading(false); }
    };

    const handleAddVideo = async (e) => {
        e.preventDefault();
        const videoId = extractYoutubeId(newVideo.youtubeUrl);
        if (!videoId) { alert("Enlace de YouTube no válido."); return; }
        setUploading(true);
        try {
            await addDoc(collection(db, 'portfolio'), {
                videoId: videoId,
                title: newVideo.title,
                genre: newVideo.genre,
                createdAt: serverTimestamp()
            });
            setIsAddingVideo(false);
            setNewVideo({ title: '', genre: '', youtubeUrl: '' });
        } catch (err) { alert(err.message); } finally { setUploading(false); }
    };

    const handleUpdateVideo = async (e) => {
        e.preventDefault();
        if (!editingVideo) return;
        const videoId = extractYoutubeId(newVideo.youtubeUrl);
        if (!videoId) { alert("Enlace de YouTube no válido."); return; }
        setUploading(true);
        try {
            await updateDoc(doc(db, 'portfolio', editingVideo.id), {
                videoId: videoId,
                title: newVideo.title,
                genre: newVideo.genre
            });
            setIsEditingVideo(false);
            setEditingVideo(null);
            setNewVideo({ title: '', genre: '', youtubeUrl: '' });
        } catch (err) { alert(err.message); } finally { setUploading(false); }
    };

    const handleUpdateSocials = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            await setDoc(doc(db, 'settings', 'socials'), socials);
            alert("Redes sociales actualizadas correctamente.");
        } catch (err) { alert(err.message); } finally { setUploading(false); }
    };

    const startEditVideo = (v) => {
        setEditingVideo(v);
        setNewVideo({ title: v.title, genre: v.genre, youtubeUrl: `https://youtube.com/watch?v=${v.videoId}` });
        setIsEditingVideo(true);
    };

    const deleteItem = async (col, id) => {
        if (window.confirm("¿Estás seguro de eliminar este elemento?")) {
            await deleteDoc(doc(db, col, id));
        }
    };

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111827', color: 'white' }}>Cargando...</div>;

    if (!isAdmin) return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111827', color: 'white', textAlign: 'center' }}>
            <ShieldCheck size={80} color="#8B5CF6" />
            <h1>ACCESO RESTRINGIDO</h1>
            <button onClick={handleLogout} style={{ marginTop: '20px', background: '#8B5CF6', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '8px', cursor: 'pointer' }}>SALIR</button>
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#02040a', color: 'white', fontFamily: '"Outfit", sans-serif' }}>
            
            {/* MODALS: ADD PRODUCT */}
            {isAddingProduct && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#0a0f1e', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '500px', border: '1px solid #8B5CF6' }}>
                        <h2 style={{ marginBottom: '20px' }}>Agregar Canción</h2>
                        <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input type="text" placeholder="Nombre de Canción" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} style={{ padding: '12px', background: '#1e293b', border: 'none', color: 'white', borderRadius: '8px' }} />
                            <input type="text" placeholder="Artista" required value={newProduct.artist} onChange={e => setNewProduct({...newProduct, artist: e.target.value})} style={{ padding: '12px', background: '#1e293b', border: 'none', color: 'white', borderRadius: '8px' }} />
                            <input type="number" placeholder="Precio ($)" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} style={{ padding: '12px', background: '#1e293b', border: 'none', color: 'white', borderRadius: '8px' }} />
                            
                            <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Carátula (JPG/PNG):</label>
                            <input type="file" accept="image/*" onChange={e => {
                                const file = e.target.files[0];
                                setNewProduct({...newProduct, coverFile: file});
                                if (file) setPreviews({...previews, cover: URL.createObjectURL(file)});
                            }} />
                            {previews.cover && <img src={previews.cover} style={{ height: '80px', width: '80px', objectFit: 'cover', borderRadius: '8px' }} />}
                            
                            <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Archivo Audio (MP3):</label>
                            <input type="file" accept="audio/*" onChange={e => setNewProduct({...newProduct, audioFile: e.target.files[0]})} />

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => { setIsAddingProduct(false); setPreviews({...previews, cover: null}); }} style={{ flex: 1, padding: '12px', background: '#334155', border: 'none', color: 'white', borderRadius: '8px' }}>CANCELAR</button>
                                <button type="submit" disabled={uploading} style={{ flex: 1, padding: '12px', background: '#8B5CF6', border: 'none', color: 'white', borderRadius: '8px' }}>{uploading ? 'SUBIENDO...' : 'GUARDAR'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: ADD PHOTO */}
            {isAddingPhoto && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#0a0f1e', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '500px', border: '1px solid #8B5CF6' }}>
                        <h2 style={{ marginBottom: '20px' }}>Agregar Foto Galería</h2>
                        <form onSubmit={handleAddPhoto} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input type="text" placeholder="Pie de foto / Descripción" value={newPhoto.caption} onChange={e => setNewPhoto({...newPhoto, caption: e.target.value})} style={{ padding: '12px', background: '#1e293b', border: 'none', color: 'white', borderRadius: '8px' }} />
                            <input type="file" required accept="image/*" onChange={e => {
                                const file = e.target.files[0];
                                setNewPhoto({...newPhoto, file: file});
                                if (file) setPreviews({...previews, photo: URL.createObjectURL(file)});
                            }} />
                            {previews.photo && <img src={previews.photo} style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }} />}
                            
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => { setIsAddingPhoto(false); setPreviews({...previews, photo: null}); }} style={{ flex: 1, padding: '12px', background: '#334155', border: 'none', color: 'white', borderRadius: '8px' }}>CANCELAR</button>
                                <button type="submit" disabled={uploading} style={{ flex: 1, padding: '12px', background: '#8B5CF6', border: 'none', color: 'white', borderRadius: '8px' }}>{uploading ? 'SUBIENDO...' : 'GUARDAR FOTO'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: ADD/EDIT VIDEO */}
            {(isAddingVideo || isEditingVideo) && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#0a0f1e', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '500px', border: '1px solid #8B5CF6' }}>
                        <h2 style={{ marginBottom: '20px' }}>{isEditingVideo ? 'Editar Video' : 'Agregar Video'}</h2>
                        <form onSubmit={isEditingVideo ? handleUpdateVideo : handleAddVideo} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input type="text" placeholder="Título / Artista" required value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} style={{ padding: '12px', background: '#1e293b', border: 'none', color: 'white', borderRadius: '8px' }} />
                            <select value={newVideo.genre} onChange={e => setNewVideo({...newVideo, genre: e.target.value})} style={{ padding: '12px', background: '#1e293b', border: 'none', color: 'white', borderRadius: '8px' }}>
                                <option value="POP">POP</option>
                                <option value="SALSA">SALSA</option>
                                <option value="URBANO">URBANO</option>
                                <option value="FOLKLORE">FOLKLORE</option>
                                <option value="BALADA">BALADA</option>
                            </select>
                            <input type="text" placeholder="Link de YouTube" required value={newVideo.youtubeUrl} onChange={e => setNewVideo({...newVideo, youtubeUrl: e.target.value})} style={{ padding: '12px', background: '#1e293b', border: 'none', color: 'white', borderRadius: '8px' }} />
                            
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => { setIsAddingVideo(false); setIsEditingVideo(false); setEditingVideo(null); setNewVideo({ title: '', genre: '', youtubeUrl: '' }); }} style={{ flex: 1, padding: '12px', background: '#334155', border: 'none', color: 'white', borderRadius: '8px' }}>CANCELAR</button>
                                <button type="submit" disabled={uploading} style={{ flex: 1, padding: '12px', background: '#8B5CF6', border: 'none', color: 'white', borderRadius: '8px' }}>{uploading ? 'GUARDANDO...' : isEditingVideo ? 'ACTUALIZAR' : 'GUARDAR'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SIDEBAR */}
            <aside style={{ width: '280px', background: '#030712', padding: '40px 20px', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
                    <ShieldCheck color="#8B5CF6" />
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>LUGO ADMIN</h2>
                </div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    <button onClick={() => setActiveTab('products')} style={{ padding: '14px', textAlign: 'left', background: activeTab === 'products' ? '#8B5CF6' : 'transparent', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', gap: '10px', fontWeight: '700' }}><Music size={20}/> Catálogo</button>
                    <button onClick={() => setActiveTab('gallery')} style={{ padding: '14px', textAlign: 'left', background: activeTab === 'gallery' ? '#8B5CF6' : 'transparent', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', gap: '10px', fontWeight: '700' }}><ImageIcon size={20}/> Galería</button>
                    <button onClick={() => setActiveTab('portfolio')} style={{ padding: '14px', textAlign: 'left', background: activeTab === 'portfolio' ? '#8B5CF6' : 'transparent', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', gap: '10px', fontWeight: '700' }}><Video size={20}/> Portafolio</button>
                    <button onClick={() => setActiveTab('socials')} style={{ padding: '14px', textAlign: 'left', background: activeTab === 'socials' ? '#8B5CF6' : 'transparent', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', gap: '10px', fontWeight: '700' }}><Share2 size={20}/> Redes</button>
                </nav>
                <button onClick={handleLogout} style={{ marginTop: 'auto', padding: '14px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', gap: '10px', fontWeight: '700' }}><LogOut size={20}/> Salir</button>
            </aside>

            {/* MAIN CONTENT */}
            <main style={{ flex: 1, padding: '60px', overflowY: 'auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div>
                        <h1 style={{ margin: 0, textTransform: 'uppercase' }}>
                            {activeTab === 'products' ? 'Catálogo de Tracks' : 
                             activeTab === 'gallery' ? 'Galería Visual' : 
                             activeTab === 'socials' ? 'Redes Sociales' : 'Portafolio Videos'}
                        </h1>
                        <p style={{ color: '#64748b', margin: 0 }}>Gestiona el contenido público de tu plataforma.</p>
                    </div>
                    {activeTab !== 'socials' && (
                        <button 
                            onClick={() => {
                                if (activeTab === 'products') setIsAddingProduct(true);
                                else if (activeTab === 'gallery') setIsAddingPhoto(true);
                                else if (activeTab === 'portfolio') setIsAddingVideo(true);
                            }}
                            style={{ background: '#8B5CF6', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '12px', cursor: 'pointer', fontWeight: '900', display: 'flex', gap: '10px', boxShadow: '0 10px 20px rgba(139, 92, 246, 0.2)' }}
                        >
                            <Plus size={20}/> AGREGAR NUEVO
                        </button>
                    )}
                </header>

                <div style={{ background: '#080d1a', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {activeTab === 'products' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                            {products.map(p => (
                                <div key={p.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '15px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <img src={p.coverUrl || '/logo.png'} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '0.9rem', margin: 0 }}>{p.name}</h3>
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{p.artist}</p>
                                    </div>
                                    <button onClick={() => deleteItem('songs', p.id)} style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '10px', cursor: 'pointer' }}><Trash2 size={18}/></button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'gallery' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                            {gallery.map(g => (
                                <div key={g.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1/1' }}>
                                    <img src={g.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button onClick={() => deleteItem('gallery', g.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'portfolio' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                            {videos.map(v => (
                                <div key={v.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                    <div style={{ aspectRatio: '16/9', background: '#000', position: 'relative' }}>
                                        <img src={`https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#8B5CF6', padding: '4px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '800' }}>{v.genre}</div>
                                    </div>
                                    <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ fontSize: '0.9rem', margin: '0 0 5px 0' }}>{v.title}</h3>
                                            <a href={`https://youtube.com/watch?v=${v.videoId}`} target="_blank" style={{ color: '#64748b', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>YouTube <ExternalLink size={12}/></a>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => startEditVideo(v)} style={{ padding: '10px', background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                                                <FileText size={18} />
                                            </button>
                                            <button onClick={() => deleteItem('portfolio', v.id)} style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'socials' && (
                        <div style={{ maxWidth: '600px' }}>
                            <form onSubmit={handleUpdateSocials} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', color: '#64748b', marginBottom: '8px', fontSize: '0.9rem' }}>Instagram</label>
                                    <input type="text" value={socials.instagram} onChange={e => setSocials({...socials, instagram: e.target.value})} placeholder="https://instagram.com/tu-usuario" style={{ width: '100%', padding: '12px', background: '#1e293b', border: 'none', color: 'white', borderRadius: '8px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#64748b', marginBottom: '8px', fontSize: '0.9rem' }}>YouTube</label>
                                    <input type="text" value={socials.youtube} onChange={e => setSocials({...socials, youtube: e.target.value})} placeholder="https://youtube.com/@tu-canal" style={{ width: '100%', padding: '12px', background: '#1e293b', border: 'none', color: 'white', borderRadius: '8px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#64748b', marginBottom: '8px', fontSize: '0.9rem' }}>TikTok</label>
                                    <input type="text" value={socials.tiktok} onChange={e => setSocials({...socials, tiktok: e.target.value})} placeholder="https://tiktok.com/@tu-perfil" style={{ width: '100%', padding: '12px', background: '#1e293b', border: 'none', color: 'white', borderRadius: '8px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#64748b', marginBottom: '8px', fontSize: '0.9rem' }}>Spotify</label>
                                    <input type="text" value={socials.spotify} onChange={e => setSocials({...socials, spotify: e.target.value})} placeholder="Enlace de artista" style={{ width: '100%', padding: '12px', background: '#1e293b', border: 'none', color: 'white', borderRadius: '8px' }} />
                                </div>
                                <button type="submit" disabled={uploading} style={{ background: '#8B5CF6', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', cursor: 'pointer', fontWeight: '900', marginTop: '10px' }}>
                                    {uploading ? 'GUARDANDO...' : 'ACTUALIZAR REDES'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
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
    Share2,
    ArrowLeft,
    Camera,
    Loader2,
    CheckCircle2 as CheckIcon,
    DollarSign,
    Users,
    TrendingUp,
    Calendar,
    Search,
    CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ── Helpers de Audio (igual que Vendedores) ──────────────────────────────────
async function generateMixBlob(tracks) {
    if (!tracks || tracks.length === 0) return null;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    try {
        const validTracks = tracks.filter(t => {
            const name = (t.displayName || '').toLowerCase();
            return !name.includes('click') && !name.includes('guide') && !name.includes('cue') && !name.includes('guia');
        });
        const buffers = await Promise.all((validTracks.length > 0 ? validTracks : tracks).map(async t => {
            const arrayBuf = await t.blob.arrayBuffer();
            return audioCtx.decodeAudioData(arrayBuf);
        }));
        const maxDuration = Math.max(...buffers.map(b => b.duration));
        const offlineCtx = new OfflineAudioContext(1, 22050 * maxDuration, 22050);
        buffers.forEach(buf => {
            const source = offlineCtx.createBufferSource();
            source.buffer = buf;
            source.connect(offlineCtx.destination);
            source.start();
        });
        const rendered = await offlineCtx.startRendering();
        return audioBufferToWav(rendered);
    } catch (e) {
        console.error('[MIX] Falló:', e);
        return null;
    }
}

function audioBufferToWav(buffer) {
    const length = buffer.length * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const sampleRate = buffer.sampleRate;
    const writeString = (v, off, str) => { for (let i = 0; i < str.length; i++) v.setUint8(off + i, str.charCodeAt(i)); };
    writeString(view, 0, 'RIFF'); view.setUint32(4, length - 8, true); writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeString(view, 36, 'data');
    view.setUint32(40, length - 44, true);
    const data = buffer.getChannelData(0); let offset = 44;
    for (let i = 0; i < data.length; i++) {
        let sample = Math.max(-1, Math.min(1, data[i]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, sample, true); offset += 2;
    }
    return new Blob([view], { type: 'audio/wav' });
}

export default function Admin() {
    const navigate = useNavigate();
    const fileInputRef = useRef();
    const coverInputRef = useRef();

    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('mt');

    // Catálogo / Galería / Videos / Socials
    const [products, setProducts] = useState([]);
    const [gallery, setGallery] = useState([]);
    const [videos, setVideos] = useState([]);
    const [socials, setSocials] = useState({ instagram: '', youtube: '', tiktok: '', spotify: '' });
    const [sales, setSales] = useState([]);
    const [salesSearch, setSalesSearch] = useState('');

    // Derived: split catalog into MTs vs simple songs
    const mtProducts = products.filter(p => Array.isArray(p.tracks) && p.tracks.length > 0);
    const simpleProducts = products.filter(p => !Array.isArray(p.tracks) || p.tracks.length === 0);

    // UI Estados Modales simples
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [isAddingPhoto, setIsAddingPhoto] = useState(false);
    const [isAddingVideo, setIsAddingVideo] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', artist: '', price: '', coverFile: null, audioFile: null });
    const [newPhoto, setNewPhoto] = useState({ caption: '', file: null });
    const [newVideo, setNewVideo] = useState({ title: '', genre: 'POP', youtubeUrl: '' });
    const [editingVideo, setEditingVideo] = useState(null);
    const [isEditingVideo, setIsEditingVideo] = useState(false);
    const [previews, setPreviews] = useState({ photo: null, cover: null });

    // ── MT Wizard States (igual que Vendedores) ──────────────────────────────
    const [mtStep, setMtStep] = useState('idle'); // idle | review-tracks | details | uploading | done | error
    const [mtError, setMtError] = useState('');
    const [fileList, setFileList] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [songName, setSongName] = useState('');
    const [artist, setArtist] = useState('');
    const [songKey, setSongKey] = useState('');
    const [tempo, setTempo] = useState('');
    const [timeSignature, setTimeSignature] = useState('4/4');
    const [price, setPrice] = useState('9.99');
    const [coverUrl, setCoverUrl] = useState('');
    const [coverFileId, setCoverFileId] = useState('');
    const [isUploadingCover, setIsUploadingCover] = useState(false);

    const devProxy = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3001' : 'https://mixernew-production.up.railway.app';

    // Auth Check
    useEffect(() => {
        const unsub = auth.onAuthStateChanged((user) => {
            const adminEmails = [
                'ueservicesllc1@gmail.com',
                'juniorlugokey@gmail.com',
                'juniorlugo@admin.com'
            ];
            
            const isAdminEmail = user && adminEmails.includes(user.email);
            const hasPinAccess = sessionStorage.getItem('admin_authenticated') === 'true';

            if (isAdminEmail || hasPinAccess) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // Fetch Data
    useEffect(() => {
        if (!isAdmin) return;
        const unsubP = onSnapshot(query(collection(db, 'songs'), orderBy('createdAt', 'desc')), (snap) => {
            setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const unsubG = onSnapshot(query(collection(db, 'gallery'), orderBy('createdAt', 'desc')), (snap) => {
            setGallery(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const unsubV = onSnapshot(query(collection(db, 'portfolio'), orderBy('createdAt', 'desc')), (snap) => {
            setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        getDoc(doc(db, 'settings', 'socials')).then(snap => { if (snap.exists()) setSocials(snap.data()); });
        const unsubS = onSnapshot(query(collection(db, 'sales'), orderBy('createdAt', 'desc')), (snap) => {
            setSales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => { unsubP(); unsubG(); unsubV(); unsubS(); };
    }, [isAdmin]);

    const handleLogout = () => { auth.signOut(); navigate('/'); };

    // ── MT Wizard Handlers (igual que Vendedores) ────────────────────────────
    const handleZipUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const zip = new JSZip();
        try {
            const cleanName = file.name.replace(/\.zip$/i, '');
            const parts = cleanName.split('-').map(p => p.trim());
            if (parts.length >= 1) setSongName(parts[0]);
            if (parts.length >= 2) setArtist(parts[1]);
            const contents = await zip.loadAsync(file);
            const extractedFiles = [];
            
            // Validación de formatos solicitada por el usuario
            const allFileNames = Object.keys(contents.files).filter(f => !contents.files[f].dir && !f.includes('__MACOSX') && !f.endsWith('.DS_Store'));
            const invalidFiles = allFileNames.filter(f => !f.toLowerCase().endsWith('.wav') && !f.toLowerCase().endsWith('.mp3'));
            
            if (invalidFiles.length > 0) {
                setMtError(`Se detectaron archivos con formato no permitido:\n\n${invalidFiles.join('\n')}\n\nSolo se permiten archivos MP3 o WAV para asegurar la calidad del marketplace.`);
                setMtStep('error');
                return;
            }

            const filesToExtract = allFileNames.filter(f => f.toLowerCase().endsWith('.wav') || f.toLowerCase().endsWith('.mp3'));
            for (let i = 0; i < filesToExtract.length; i++) {
                const filename = filesToExtract[i];
                const fileData = await contents.files[filename].async('blob');
                let rawName = filename.split('/').pop().replace(/\.(wav|mp3|WAV|MP3)$/i, '');
                let finalDisplayName = rawName.replace(/[^a-zA-Z0-9_-]/g, ' ').trim();
                if (finalDisplayName.toLowerCase().includes('clicktrack')) finalDisplayName = 'Click';
                extractedFiles.push({ 
                    originalName: filename, 
                    displayName: finalDisplayName, 
                    blob: fileData, 
                    extension: filename.split('.').pop().toLowerCase() 
                });
            }
            if (extractedFiles.length === 0) throw new Error('No se encontraron archivos de audio en el ZIP.');
            setFileList(extractedFiles);
            setMtStep('review-tracks');
        } catch (err) { alert('Error: ' + err.message); }
        e.target.value = '';
    };

    const handleCoverUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploadingCover(true);
        try {
            const formData = new FormData();
            formData.append('audioFile', file);
            formData.append('fileName', `cover_admin_${Date.now()}.${file.name.split('.').pop()}`);
            const res = await fetch(`${devProxy}/api/upload`, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.url) { setCoverUrl(data.url); setCoverFileId(data.fileId); }
        } catch (err) { alert('Error al subir portada: ' + err.message); }
        finally { setIsUploadingCover(false); }
    };

    const uploadMtToB2 = async () => {
        if (!songName.trim()) return alert('Nombre requerido');
        if (!coverUrl) return alert('La portada es obligatoria.');
        setMtStep('uploading');
        const uploadedTracksInfo = [];
        try {
            for (let i = 0; i < fileList.length; i++) {
                const track = fileList[i];
                const formData = new FormData();
                formData.append('audioFile', track.blob);
                // Usar extensión original para preservar calidad (wav o mp3)
                const b2Filename = `sell_admin_${Date.now()}_${songName.replace(/\s+/g, '_')}_${track.displayName.replace(/\s+/g, '_')}.${track.extension}`;
                formData.append('fileName', b2Filename);
                formData.append('generatePreview', 'true');
                const uploadRes = await fetch(`${devProxy}/api/upload`, { method: 'POST', body: formData });
                if (!uploadRes.ok) throw new Error(`Fallo al subir pista ${track.displayName}`);
                const uploadData = await uploadRes.json();
                uploadedTracksInfo.push({
                    name: track.displayName,
                    url: uploadData.url,
                    previewUrl: uploadData.previewUrl || uploadData.url,
                    b2FileId: uploadData.fileId,
                    sizeMB: (track.blob.size / 1024 / 1024).toFixed(2)
                });
                setUploadProgress(Math.round(((i + 1) / (fileList.length + 1)) * 100));
            }
            const mixBlob = await generateMixBlob(fileList);
            if (mixBlob) {
                const formData = new FormData();
                formData.append('audioFile', mixBlob);
                // El mix total es un WAV generado en el cliente
                formData.append('fileName', `sell_admin_${Date.now()}_${songName.replace(/\s+/g, '_')}__PreviewMix.wav`);
                formData.append('generatePreview', 'true');
                const res = await fetch(`${devProxy}/api/upload`, { method: 'POST', body: formData });
                if (res.ok) {
                    const data = await res.json();
                    uploadedTracksInfo.push({ name: '__PreviewMix', url: data.url, previewUrl: data.previewUrl, b2FileId: data.fileId, isWaveformSource: true, sizeMB: (mixBlob.size / 1024 / 1024).toFixed(2) });
                }
            }
            await addDoc(collection(db, 'songs'), {
                name: songName,
                artist: artist || 'Junior Lugo',
                sellerName: 'Junior Lugo',
                key: songKey,
                tempo,
                timeSignature,
                price: parseFloat(price) || 0,
                forSale: true,
                status: 'active',
                userId: auth.currentUser?.uid || 'admin',
                userEmail: auth.currentUser?.email || 'admin',
                tracks: uploadedTracksInfo,
                coverUrl,
                coverFileId,
                createdAt: serverTimestamp(),
                isGlobal: true,
                isAdminUpload: true,
                isMultitrack: true,
            });
            setMtStep('done');
        } catch (e) {
            console.error('Upload Error:', e);
            alert('Error: ' + e.message);
            setMtStep('details');
        }
    };

    const resetMtWizard = () => {
        setMtStep('idle'); setFileList([]); setSongName(''); setArtist('');
        setSongKey(''); setTempo(''); setTimeSignature('4/4'); setPrice('9.99');
        setCoverUrl(''); setCoverFileId(''); setUploadProgress(0); setMtError('');
    };

    // ── Catálogo handlers ────────────────────────────────────────────────────
    const uploadToB2 = async (file) => {
        if (!file) return null;
        const formData = new FormData();
        const b2FileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        formData.append('audioFile', file);
        formData.append('fileName', b2FileName);
        const res = await fetch(`${devProxy}/api/upload`, { method: 'POST', body: formData });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Error subiendo'); }
        return (await res.json()).url;
    };

    const handleAddProduct = async (e) => {
        e.preventDefault(); setUploading(true);
        try {
            const coverUrl2 = newProduct.coverFile ? await uploadToB2(newProduct.coverFile) : '';
            const audioUrl = newProduct.audioFile ? await uploadToB2(newProduct.audioFile) : '';
            await addDoc(collection(db, 'songs'), { name: newProduct.name, artist: newProduct.artist, price: parseFloat(newProduct.price) || 0, coverUrl: coverUrl2, audioUrl, forSale: true, status: 'active', createdAt: serverTimestamp() });
            setIsAddingProduct(false);
            setNewProduct({ name: '', artist: '', price: '', coverFile: null, audioFile: null });
            setPreviews({ ...previews, cover: null });
        } catch (err) { alert(err.message); } finally { setUploading(false); }
    };

    const handleAddPhoto = async (e) => {
        e.preventDefault(); if (!newPhoto.file) return; setUploading(true);
        try {
            const url = await uploadToB2(newPhoto.file);
            await addDoc(collection(db, 'gallery'), { url, caption: newPhoto.caption, createdAt: serverTimestamp() });
            setIsAddingPhoto(false); setNewPhoto({ caption: '', file: null }); setPreviews({ ...previews, photo: null });
        } catch (err) { alert(err.message); } finally { setUploading(false); }
    };

    const extractYoutubeId = (url) => {
        const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleAddVideo = async (e) => {
        e.preventDefault();
        const videoId = extractYoutubeId(newVideo.youtubeUrl);
        if (!videoId) { alert('Enlace de YouTube no válido.'); return; }
        setUploading(true);
        try {
            await addDoc(collection(db, 'portfolio'), { videoId, title: newVideo.title, genre: newVideo.genre, createdAt: serverTimestamp() });
            setIsAddingVideo(false); setNewVideo({ title: '', genre: 'POP', youtubeUrl: '' });
        } catch (err) { alert(err.message); } finally { setUploading(false); }
    };

    const handleUpdateVideo = async (e) => {
        e.preventDefault(); if (!editingVideo) return;
        const videoId = extractYoutubeId(newVideo.youtubeUrl);
        if (!videoId) { alert('Enlace de YouTube no válido.'); return; }
        setUploading(true);
        try {
            await updateDoc(doc(db, 'portfolio', editingVideo.id), { videoId, title: newVideo.title, genre: newVideo.genre });
            setIsEditingVideo(false); setEditingVideo(null); setNewVideo({ title: '', genre: 'POP', youtubeUrl: '' });
        } catch (err) { alert(err.message); } finally { setUploading(false); }
    };

    const handleUpdateSocials = async (e) => {
        e.preventDefault(); setUploading(true);
        try { await setDoc(doc(db, 'settings', 'socials'), socials); alert('Redes actualizadas.'); }
        catch (err) { alert(err.message); } finally { setUploading(false); }
    };

    const startEditVideo = (v) => {
        setEditingVideo(v); setNewVideo({ title: v.title, genre: v.genre, youtubeUrl: `https://youtube.com/watch?v=${v.videoId}` }); setIsEditingVideo(true);
    };

    const deleteItem = async (col, id) => {
        if (window.confirm('¿Eliminar este elemento?')) await deleteDoc(doc(db, col, id));
    };

    // ── Styles ───────────────────────────────────────────────────────────────
    const S = {
        input: { padding: '12px', background: '#1e293b', border: 'none', color: 'white', borderRadius: '8px', width: '100%', boxSizing: 'border-box' },
        inputLight: { padding: '12px', background: 'white', border: '1px solid #cbd5e1', color: '#1e293b', borderRadius: '8px', width: '100%', boxSizing: 'border-box' },
        overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
        modal: { background: '#0a0f1e', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '500px', border: '1px solid #8B5CF6' },
        sideBtn: (active) => ({ padding: '14px', textAlign: 'left', background: active ? '#8B5CF6' : 'transparent', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', gap: '10px', fontWeight: '700', width: '100%' }),
        btnPurple: { background: '#8B5CF6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800' },
        btnGhost: { background: '#334155', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' },
        btnTeal: { background: '#00bcd4', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800' },
    };

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111827', color: 'white' }}>Cargando...</div>;
    if (!isAdmin) return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111827', color: 'white', textAlign: 'center' }}>
            <ShieldCheck size={80} color="#8B5CF6" />
            <h1>ACCESO RESTRINGIDO</h1>
            <button onClick={handleLogout} style={{ marginTop: '20px', ...S.btnPurple }}>SALIR</button>
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#02040a', color: 'white', fontFamily: '"Outfit", sans-serif' }}>

            {/* MODAL: PRODUCTO SIMPLE */}
            {isAddingProduct && (
                <div style={S.overlay}>
                    <div style={S.modal}>
                        <h2 style={{ marginBottom: '20px' }}>Agregar Canción</h2>
                        <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input style={S.input} type="text" placeholder="Nombre" required value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                            <input style={S.input} type="text" placeholder="Artista" required value={newProduct.artist} onChange={e => setNewProduct({ ...newProduct, artist: e.target.value })} />
                            <input style={S.input} type="number" placeholder="Precio ($)" required value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
                            <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Carátula:</label>
                            <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; setNewProduct({ ...newProduct, coverFile: f }); if (f) setPreviews({ ...previews, cover: URL.createObjectURL(f) }); }} />
                            {previews.cover && <img src={previews.cover} style={{ height: '80px', width: '80px', objectFit: 'cover', borderRadius: '8px' }} />}
                            <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Audio:</label>
                            <input type="file" accept="audio/*" onChange={e => setNewProduct({ ...newProduct, audioFile: e.target.files[0] })} />
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => { setIsAddingProduct(false); setPreviews({ ...previews, cover: null }); }} style={{ flex: 1, ...S.btnGhost }}>CANCELAR</button>
                                <button type="submit" disabled={uploading} style={{ flex: 1, ...S.btnPurple }}>{uploading ? 'SUBIENDO...' : 'GUARDAR'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: FOTO */}
            {isAddingPhoto && (
                <div style={S.overlay}>
                    <div style={S.modal}>
                        <h2 style={{ marginBottom: '20px' }}>Agregar Foto Galería</h2>
                        <form onSubmit={handleAddPhoto} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input style={S.input} type="text" placeholder="Descripción" value={newPhoto.caption} onChange={e => setNewPhoto({ ...newPhoto, caption: e.target.value })} />
                            <input type="file" required accept="image/*" onChange={e => { const f = e.target.files[0]; setNewPhoto({ ...newPhoto, file: f }); if (f) setPreviews({ ...previews, photo: URL.createObjectURL(f) }); }} />
                            {previews.photo && <img src={previews.photo} style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }} />}
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => { setIsAddingPhoto(false); setPreviews({ ...previews, photo: null }); }} style={{ flex: 1, ...S.btnGhost }}>CANCELAR</button>
                                <button type="submit" disabled={uploading} style={{ flex: 1, ...S.btnPurple }}>{uploading ? 'SUBIENDO...' : 'GUARDAR'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: VIDEO */}
            {(isAddingVideo || isEditingVideo) && (
                <div style={S.overlay}>
                    <div style={S.modal}>
                        <h2 style={{ marginBottom: '20px' }}>{isEditingVideo ? 'Editar Video' : 'Agregar Video'}</h2>
                        <form onSubmit={isEditingVideo ? handleUpdateVideo : handleAddVideo} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input style={S.input} type="text" placeholder="Título / Artista" required value={newVideo.title} onChange={e => setNewVideo({ ...newVideo, title: e.target.value })} />
                            <select style={S.input} value={newVideo.genre} onChange={e => setNewVideo({ ...newVideo, genre: e.target.value })}>
                                {['POP', 'SALSA', 'URBANO', 'FOLKLORE', 'BALADA'].map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                            <input style={S.input} type="text" placeholder="Link de YouTube" required value={newVideo.youtubeUrl} onChange={e => setNewVideo({ ...newVideo, youtubeUrl: e.target.value })} />
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => { setIsAddingVideo(false); setIsEditingVideo(false); setEditingVideo(null); setNewVideo({ title: '', genre: 'POP', youtubeUrl: '' }); }} style={{ flex: 1, ...S.btnGhost }}>CANCELAR</button>
                                <button type="submit" disabled={uploading} style={{ flex: 1, ...S.btnPurple }}>{uploading ? 'GUARDANDO...' : isEditingVideo ? 'ACTUALIZAR' : 'GUARDAR'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SIDEBAR */}
            <aside style={{ width: '260px', background: '#030712', padding: '40px 20px', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
                    <ShieldCheck color="#8B5CF6" />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '900', margin: 0 }}>LUGO ADMIN</h2>
                </div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <button onClick={() => { setActiveTab('mt'); resetMtWizard(); }} style={S.sideBtn(activeTab === 'mt')}><Upload size={18} /> Subir MT</button>
                    <button onClick={() => setActiveTab('catalogoMT')} style={S.sideBtn(activeTab === 'catalogoMT')}><Music size={18} /> Catálogo MT</button>
                    <button onClick={() => setActiveTab('products')} style={S.sideBtn(activeTab === 'products')}><Music size={18} /> Catálogo Simple</button>
                    <button onClick={() => setActiveTab('gallery')} style={S.sideBtn(activeTab === 'gallery')}><ImageIcon size={18} /> Galería</button>
                    <button onClick={() => setActiveTab('portfolio')} style={S.sideBtn(activeTab === 'portfolio')}><Video size={18} /> Portafolio</button>
                    <button onClick={() => setActiveTab('sales')} style={S.sideBtn(activeTab === 'sales')}><DollarSign size={18} /> Ventas</button>
                    <button onClick={() => setActiveTab('socials')} style={S.sideBtn(activeTab === 'socials')}><Share2 size={18} /> Redes</button>
                </nav>
                <button onClick={handleLogout} style={{ marginTop: 'auto', padding: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', gap: '10px', fontWeight: '700' }}><LogOut size={18} /> Salir</button>
            </aside>

            {/* MAIN */}
            <main style={{ flex: 1, padding: '50px', overflowY: 'auto' }}>

                {/* ── TAB: SUBIR MT (wizard completo de Vendedores) ── */}
                {activeTab === 'mt' && (
                    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
                        <input ref={fileInputRef} type="file" accept=".zip" onChange={handleZipUpload} style={{ display: 'none' }} />
                        <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: 'none' }} />

                        {/* IDLE */}
                        {mtStep === 'idle' && (
                            <>
                                <header style={{ marginBottom: '40px' }}>
                                    <h1 style={{ margin: '0 0 8px', textTransform: 'uppercase' }}>Subir Multitrack</h1>
                                    <p style={{ color: '#64748b', margin: '0 0 20px' }}>Carga un ZIP con las pistas y publícalo en el marketplace.</p>
                                    <div style={{ background: 'rgba(0,188,212,0.08)', borderLeft: '4px solid #00bcd4', padding: '14px 20px', borderRadius: '12px', fontSize: '0.85rem' }}>
                                        <span style={{ fontWeight: '800', color: '#00bcd4', display: 'block', marginBottom: '4px' }}>FORMATO DEL ARCHIVO ZIP</span>
                                        <div style={{ color: '#94a3b8' }}>Nombre del archivo: <strong>NOMBRE - ARTISTA - NOTA - TEMPO.zip</strong></div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginTop: '4px' }}>Ej: Celebra victorioso - Juan Carlos - Am - 98BPM.zip</div>
                                    </div>
                                </header>
                                <button onClick={() => fileInputRef.current.click()} style={{ ...S.btnTeal, padding: '16px 40px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Upload size={20} /> CARGAR ARCHIVO ZIP
                                </button>
                            </>
                        )}

                        {/* REVIEW-TRACKS */}
                        {mtStep === 'review-tracks' && (
                            <div style={{ background: '#080d1a', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                    <button onClick={resetMtWizard} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}><ArrowLeft size={20} /></button>
                                    <div>
                                        <h2 style={{ margin: 0, fontWeight: '900' }}>Revisar Nombres de Tracks</h2>
                                        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>Asegúrate de que los tracks tengan nombres claros (Drum, Bass, Piano, etc.)</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px', maxHeight: '420px', overflowY: 'auto', paddingRight: '6px' }}>
                                    {fileList.map((track, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            <div style={{ width: '38px', height: '38px', background: 'rgba(0,188,212,0.12)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00bcd4', flexShrink: 0 }}>
                                                <Music size={18} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '800' }}>Nombre de la Pista</div>
                                                <input
                                                    style={{ ...S.inputLight, background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '9px 12px' }}
                                                    value={track.displayName}
                                                    onChange={e => { const l = [...fileList]; l[idx].displayName = e.target.value; setFileList(l); }}
                                                />
                                            </div>
                                            <div style={{ color: '#475569', fontSize: '0.8rem', fontWeight: '700', flexShrink: 0 }}>.{track.extension}</div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button onClick={resetMtWizard} style={{ flex: 1, ...S.btnGhost }}>Cancelar</button>
                                    <button onClick={() => setMtStep('details')} style={{ flex: 2, ...S.btnTeal }}>Confirmar y Siguiente →</button>
                                </div>
                            </div>
                        )}

                        {/* DETAILS */}
                        {mtStep === 'details' && (
                            <div style={{ background: '#080d1a', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
                                    <button onClick={() => setMtStep('review-tracks')} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}><ArrowLeft size={20} /></button>
                                    <h2 style={{ margin: 0, fontWeight: '900' }}>Configurar Venta de Pista</h2>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '24px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Nombre de la Canción</label>
                                        <input style={{ ...S.input }} value={songName} onChange={e => setSongName(e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Artista</label>
                                        <input style={{ ...S.input }} value={artist} onChange={e => setArtist(e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Key (Tono)</label>
                                        <input style={{ ...S.input }} value={songKey} onChange={e => setSongKey(e.target.value)} placeholder="Ej: Am, G, C#" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Tempo (BPM)</label>
                                        <input style={{ ...S.input }} value={tempo} onChange={e => setTempo(e.target.value)} placeholder="Ej: 98" />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Compás (Time Signature)</label>
                                        <select style={{ ...S.input }} value={timeSignature} onChange={e => setTimeSignature(e.target.value)}>
                                            {['4/4', '3/4', '6/8', '2/4', '4/2', '5/4', '12/8'].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#00bcd4', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Precio de Venta (USD)</label>
                                        <input type="number" step="0.01" min="0" style={{ ...S.input, fontSize: '1.2rem', fontWeight: '900' }} value={price} onChange={e => setPrice(e.target.value)} />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '10px', textTransform: 'uppercase' }}>Portada de la Canción (400×400 recomendado)</label>
                                        <div
                                            onClick={() => coverInputRef.current.click()}
                                            style={{ border: `2px dashed ${coverUrl ? '#00bcd4' : '#334155'}`, borderRadius: '16px', padding: '28px', textAlign: 'center', cursor: 'pointer', background: coverUrl ? 'rgba(0,188,212,0.05)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}
                                        >
                                            {isUploadingCover ? (
                                                <Loader2 size={32} style={{ margin: '0 auto', color: '#00bcd4', animation: 'spin 1s linear infinite' }} />
                                            ) : coverUrl ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                    <img src={coverUrl} alt="Cover" style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }} />
                                                    <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: '700' }}>✓ Portada lista</span>
                                                </div>
                                            ) : (
                                                <div style={{ color: '#64748b' }}>
                                                    <Camera size={32} style={{ margin: '0 auto 8px' }} />
                                                    <div style={{ fontWeight: '600' }}>Haz clic para subir imagen de portada</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button onClick={resetMtWizard} style={{ flex: 1, ...S.btnGhost }}>Cancelar</button>
                                    <button
                                        onClick={uploadMtToB2}
                                        disabled={isUploadingCover || !coverUrl}
                                        style={{ flex: 2, ...S.btnTeal, opacity: (isUploadingCover || !coverUrl) ? 0.5 : 1 }}
                                    >
                                        {isUploadingCover ? 'Subiendo portada...' : 'PUBLICAR PARA VENTA'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* UPLOADING */}
                        {mtStep === 'uploading' && (
                            <div style={{ background: '#080d1a', padding: '60px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                                <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 40px' }}>
                                    <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="#00bcd4" strokeWidth="6" strokeDasharray="283" strokeDashoffset={283 - (283 * uploadProgress) / 100} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                                    </svg>
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '1.5rem', fontWeight: '900' }}>{uploadProgress}%</div>
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px' }}>Subiendo Multitracks...</h3>
                                <p style={{ color: '#64748b' }}>Preparando archivos para el marketplace. No cierres esta pestaña.</p>
                            </div>
                        )}

                        {/* DONE */}
                        {mtStep === 'done' && (
                            <div style={{ background: '#080d1a', padding: '60px', borderRadius: '24px', border: '1px solid #10b981', textAlign: 'center' }}>
                                <div style={{ width: '80px', height: '80px', background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <CheckIcon size={40} color="#10b981" />
                                </div>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '12px' }}>¡Publicado con éxito!</h3>
                                <p style={{ color: '#64748b', marginBottom: '30px' }}>La canción ya está disponible en el marketplace principal.</p>
                                <button onClick={resetMtWizard} style={{ ...S.btnTeal, padding: '15px 40px' }}>SUBIR OTRO MULTITRACK</button>
                            </div>
                        )}

                        {/* ERROR POPUP */}
                        {mtStep === 'error' && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', padding: '50px', borderRadius: '24px', border: '1px solid #ef4444', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                                <div style={{ width: '80px', height: '80px', background: 'rgba(239,68,68,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <X size={40} color="#ef4444" />
                                </div>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ef4444', marginBottom: '16px' }}>¡Formato No Permitido!</h2>
                                <p style={{ color: 'white', fontSize: '1.1rem', marginBottom: '30px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{mtError}</p>
                                <button onClick={resetMtWizard} style={{ ...S.btnGhost, padding: '15px 40px', fontWeight: '800' }}>VOLVER A INTENTAR</button>
                            </div>
                        )}

                    </div>
                )}

                {/* ── TAB: CATÁLOGO MT ── */}
                {activeTab === 'catalogoMT' && (
                    <>
                        <header style={{ marginBottom: '30px' }}>
                            <h1 style={{ margin: '0 0 6px', textTransform: 'uppercase' }}>Catálogo MT</h1>
                            <p style={{ color: '#64748b', margin: 0 }}>Multitracks subidos con el wizard ZIP — con pistas individuales y preview de 20 seg.</p>
                        </header>
                        <div style={{ background: '#080d1a', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                                {mtProducts.map(p => (
                                    <div key={p.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '14px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '14px', alignItems: 'center' }}>
                                        <img src={p.coverUrl || '/logo.png'} style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: '800', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px' }}>{p.artist} · ${p.price}</div>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                {p.key && <span style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700' }}>{p.key}</span>}
                                                {p.tempo && <span style={{ background: 'rgba(0,188,212,0.1)', color: '#00bcd4', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700' }}>{p.tempo} BPM</span>}
                                                <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700' }}>{(p.tracks || []).length} pistas</span>
                                            </div>
                                        </div>
                                        <button onClick={() => deleteItem('songs', p.id)} style={{ padding: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', flexShrink: 0 }}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                {mtProducts.length === 0 && <p style={{ color: '#475569', padding: '20px' }}>No hay multitracks subidos todavía.</p>}
                            </div>
                        </div>
                    </>
                )}

                {/* ── TAB: CATÁLOGO SIMPLE ── */}
                {activeTab === 'products' && (
                    <>
                        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <div>
                                <h1 style={{ margin: 0, textTransform: 'uppercase' }}>Catálogo Simple</h1>
                                <p style={{ color: '#64748b', margin: 0 }}>Canciones simples (sin pistas individuales). Los MTs están en "Catálogo MT".</p>
                            </div>
                            <button onClick={() => setIsAddingProduct(true)} style={{ ...S.btnPurple, display: 'flex', gap: '8px', alignItems: 'center' }}><Plus size={18} /> AGREGAR</button>
                        </header>
                        <div style={{ background: '#080d1a', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                                {simpleProducts.map(p => (
                                    <div key={p.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '14px', padding: '14px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '14px', alignItems: 'center' }}>
                                        <img src={p.coverUrl || '/logo.png'} style={{ width: '54px', height: '54px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: '800', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.artist} · ${p.price}</div>
                                        </div>
                                        <button onClick={() => deleteItem('songs', p.id)} style={{ padding: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', flexShrink: 0 }}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                {simpleProducts.length === 0 && <p style={{ color: '#475569', padding: '20px' }}>No hay canciones simples. Los MTs están en "Catálogo MT".</p>}
                            </div>
                        </div>
                    </>
                )}

                {/* ── TAB: GALERÍA ── */}
                {activeTab === 'gallery' && (
                    <>
                        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <div>
                                <h1 style={{ margin: 0, textTransform: 'uppercase' }}>Galería Visual</h1>
                                <p style={{ color: '#64748b', margin: 0 }}>Fotos públicas de la plataforma.</p>
                            </div>
                            <button onClick={() => setIsAddingPhoto(true)} style={{ ...S.btnPurple, display: 'flex', gap: '8px', alignItems: 'center' }}><Plus size={18} /> AGREGAR</button>
                        </header>
                        <div style={{ background: '#080d1a', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                                {gallery.map(g => (
                                    <div key={g.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1/1' }}>
                                        <img src={g.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button onClick={() => deleteItem('gallery', g.id)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239,68,68,0.9)', color: 'white', border: 'none', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                    </div>
                                ))}
                                {gallery.length === 0 && <p style={{ color: '#475569', padding: '20px' }}>No hay fotos en la galería.</p>}
                            </div>
                        </div>
                    </>
                )}

                {/* ── TAB: PORTAFOLIO ── */}
                {activeTab === 'portfolio' && (
                    <>
                        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <div>
                                <h1 style={{ margin: 0, textTransform: 'uppercase' }}>Portafolio Videos</h1>
                                <p style={{ color: '#64748b', margin: 0 }}>Videos de YouTube del portafolio.</p>
                            </div>
                            <button onClick={() => setIsAddingVideo(true)} style={{ ...S.btnPurple, display: 'flex', gap: '8px', alignItems: 'center' }}><Plus size={18} /> AGREGAR</button>
                        </header>
                        <div style={{ background: '#080d1a', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                                {videos.map(v => (
                                    <div key={v.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                        <div style={{ aspectRatio: '16/9', position: 'relative' }}>
                                            <img src={`https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#8B5CF6', padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '800' }}>{v.genre}</div>
                                        </div>
                                        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: '800', fontSize: '0.9rem', marginBottom: '4px' }}>{v.title}</div>
                                                <a href={`https://youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noreferrer" style={{ color: '#64748b', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>YouTube <ExternalLink size={11} /></a>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => startEditVideo(v)} style={{ padding: '8px', background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><FileText size={16} /></button>
                                                <button onClick={() => deleteItem('portfolio', v.id)} style={{ padding: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {videos.length === 0 && <p style={{ color: '#475569', padding: '20px' }}>No hay videos en el portafolio.</p>}
                            </div>
                        </div>
                    </>
                )}

                {/* ── TAB: REDES SOCIALES ── */}
                {activeTab === 'socials' && (
                    <>
                        <header style={{ marginBottom: '30px' }}>
                            <h1 style={{ margin: 0, textTransform: 'uppercase' }}>Redes Sociales</h1>
                            <p style={{ color: '#64748b', margin: 0 }}>Links de redes sociales visibles en la plataforma.</p>
                        </header>
                        <div style={{ background: '#080d1a', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', maxWidth: '600px' }}>
                            <form onSubmit={handleUpdateSocials} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {[
                                    { label: 'Instagram', key: 'instagram', ph: 'https://instagram.com/tu-usuario' },
                                    { label: 'YouTube', key: 'youtube', ph: 'https://youtube.com/@tu-canal' },
                                    { label: 'TikTok', key: 'tiktok', ph: 'https://tiktok.com/@tu-perfil' },
                                    { label: 'Spotify', key: 'spotify', ph: 'Enlace de artista' },
                                ].map(({ label, key, ph }) => (
                                    <div key={key}>
                                        <label style={{ display: 'block', color: '#64748b', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '700' }}>{label}</label>
                                        <input type="text" value={socials[key]} onChange={e => setSocials({ ...socials, [key]: e.target.value })} placeholder={ph} style={S.input} />
                                    </div>
                                ))}
                                <button type="submit" disabled={uploading} style={{ ...S.btnPurple, padding: '14px', marginTop: '8px' }}>
                                    {uploading ? 'GUARDANDO...' : 'ACTUALIZAR REDES'}
                                </button>
                            </form>
                        </div>
                    </>
                )}

                {/* ── TAB: VENTAS ── */}
                {activeTab === 'sales' && (
                    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                        <header style={{ marginBottom: '40px' }}>
                            <h1 style={{ margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Registro de Ventas</h1>
                            <p style={{ color: '#64748b', margin: 0 }}>Historial de transacciones y métricas de ingresos.</p>
                        </header>

                        {/* Metrics Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', padding: '24px', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
                                <DollarSign style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.2, width: '100px', height: '100px' }} />
                                <div style={{ fontSize: '0.85rem', fontWeight: '800', opacity: 0.8, textTransform: 'uppercase', marginBottom: '8px' }}>Ingresos Totales</div>
                                <div style={{ fontSize: '2.2rem', fontWeight: '900' }}>${sales.reduce((acc, s) => acc + (parseFloat(s.total) || 0), 0).toFixed(2)}</div>
                            </div>
                            <div style={{ background: '#080d1a', border: '1px solid rgba(255,255,255,0.08)', padding: '24px', borderRadius: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Ventas Totales</div>
                                    <TrendingUp size={20} color="#10b981" />
                                </div>
                                <div style={{ fontSize: '2.2rem', fontWeight: '900' }}>{sales.length}</div>
                                <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '4px', fontWeight: '700' }}>+100% crecimiento</div>
                            </div>
                            <div style={{ background: '#080d1a', border: '1px solid rgba(255,255,255,0.08)', padding: '24px', borderRadius: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Últimos 30 Días</div>
                                    <Calendar size={20} color="#8B5CF6" />
                                </div>
                                <div style={{ fontSize: '2.2rem', fontWeight: '900' }}>
                                    ${sales
                                        .filter(s => s.createdAt?.toDate() > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
                                        .reduce((acc, s) => acc + (parseFloat(s.total) || 0), 0)
                                        .toFixed(2)}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#8B5CF6', marginTop: '4px', fontWeight: '700' }}>Ingresos recientes</div>
                            </div>
                        </div>

                        {/* Sales Table Holder */}
                        <div style={{ background: '#080d1a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', overflow: 'hidden' }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.2rem' }}>Transacciones Recientes</h3>
                                <div style={{ position: 'relative', width: '300px' }}>
                                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} size={16} />
                                    <input 
                                        style={{ ...S.input, paddingLeft: '40px', margin: 0, height: '42px', fontSize: '0.9rem' }} 
                                        placeholder="Buscar por cliente o canción..." 
                                        value={salesSearch}
                                        onChange={e => setSalesSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                            {['Fecha', 'Cliente', 'Productos', 'Total', 'Método', 'Estado'].map(h => (
                                                <th key={h} style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sales
                                            .filter(s => {
                                                const search = salesSearch.toLowerCase();
                                                const emailMatch = s.userEmail?.toLowerCase().includes(search);
                                                const nameMatch = s.userName?.toLowerCase().includes(search);
                                                const songMatch = s.songs?.some(song => song.name.toLowerCase().includes(search));
                                                return !salesSearch || emailMatch || nameMatch || songMatch;
                                            })
                                            .map((sale) => (
                                                <tr key={sale.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.01)' } }}>
                                                    <td style={{ padding: '20px 24px', fontSize: '0.85rem', color: '#94a3b8' }}>
                                                        {sale.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '20px 24px' }}>
                                                        <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{sale.userName}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#475569' }}>{sale.userEmail}</div>
                                                    </td>
                                                    <td style={{ padding: '20px 24px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            {sale.songs?.map((song, i) => (
                                                                <div key={i} style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8B5CF6' }}></div>
                                                                    {song.name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '20px 24px', fontWeight: '900', color: '#10b981' }}>
                                                        ${parseFloat(sale.total).toFixed(2)}
                                                    </td>
                                                    <td style={{ padding: '20px 24px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800' }}>
                                                            <CreditCard size={14} /> {sale.paymentMethod || 'PayPal'}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '20px 24px' }}>
                                                        <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '6px 12px', borderRadius: '30px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>
                                                            Completado
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        {sales.length === 0 && (
                                            <tr>
                                                <td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>
                                                    No hay ventas registradas todavía.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </main>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

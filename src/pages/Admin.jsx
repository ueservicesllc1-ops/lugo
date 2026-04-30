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
    CreditCard,
    Music2
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
    /** Coincide con Firestore rules `isAdmin()` (email en lista). El PIN de sesión no otorga token Firebase. */
    const [firebaseAdmin, setFirebaseAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('mt');

    // Catálogo / Galería / Videos / Socials
    const [products, setProducts] = useState([]);
    const [gallery, setGallery] = useState([]);
    const [videos, setVideos] = useState([]);
    const [socials, setSocials] = useState({ instagram: '', youtube: '', tiktok: '', spotify: '' });
    const [pricing, setPricing] = useState({ wavPrice: 29.00, stemsPrice: 15.00, mp3Price: 9.00, wavTrackPrice: 15.00 });
    const [users, setUsers] = useState([]);
    const [usersSearch, setUsersSearch] = useState('');
    const [userSortField, setUserSortField] = useState('createdAt'); // 'createdAt' | 'mtCount'
    const [userSortOrder, setUserSortOrder] = useState('desc'); // 'asc' | 'desc'
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
    const [newProduct, setNewProduct] = useState({ name: '', artist: '', priceWav: '', priceMp3: '', coverFile: null, audioFile: null });
    const [newPhoto, setNewPhoto] = useState({ caption: '', file: null });
    const [newVideo, setNewVideo] = useState({ title: '', genre: 'POP', youtubeUrl: '' });
    const [editingVideo, setEditingVideo] = useState(null);
    const [isEditingVideo, setIsEditingVideo] = useState(false);
    const [routesModalSong, setRoutesModalSong] = useState(null);
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
    const [priceCustomMix, setPriceCustomMix] = useState('15.00');
    const [priceWavTrack, setPriceWavTrack] = useState('15.00');
    const [priceMp3Track, setPriceMp3Track] = useState('9.00');
    const [mtPriceTouched, setMtPriceTouched] = useState(false);
    const [zipFolderName, setZipFolderName] = useState('');
    const [coverUrl, setCoverUrl] = useState('');
    const [coverFileId, setCoverFileId] = useState('');
    const [isUploadingCover, setIsUploadingCover] = useState(false);

    const proxyBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3001'
        : window.location.origin;
    const sanitizePathSegment = (value) => String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 80);

    const getProxyUrl = (url) => {
        if (!url) return '';
        const cleanUrl = String(url).split(',')[0].trim();
        if (cleanUrl.startsWith('/') || cleanUrl.includes('localhost') || cleanUrl.startsWith('blob:')) return cleanUrl;

        return `${proxyBase}/api/download?url=${encodeURIComponent(cleanUrl)}`;
    };

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

            setFirebaseAdmin(!!isAdminEmail);
            if (isAdminEmail || hasPinAccess) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // Listeners que exigen token admin en Firestore (ventas / usuarios); PIN solo no basta
    useEffect(() => {
        if (!firebaseAdmin) return;
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
        const unsubU = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), (snap) => {
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        getDoc(doc(db, 'settings', 'multitrack_pricing')).then(snap => { 
            if (snap.exists()) setPricing(snap.data()); 
        });
        return () => { unsubP(); unsubG(); unsubV(); unsubS(); unsubU(); };
    }, [firebaseAdmin]);

    useEffect(() => {
        if (mtPriceTouched) return;
        setPrice(String(pricing.wavPrice ?? 29.0));
        setPriceCustomMix(String(pricing.stemsPrice ?? 15.0));
        setPriceWavTrack(String(pricing.wavTrackPrice ?? 15.0));
        setPriceMp3Track(String(pricing.mp3Price ?? 9.0));
    }, [pricing, mtPriceTouched]);

    const handleLogout = () => { auth.signOut(); navigate('/'); };

    // ── MT Wizard Handlers (igual que Vendedores) ────────────────────────────
    const handleZipUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const zip = new JSZip();
        try {
            const cleanName = file.name.replace(/\.zip$/i, '');
            const safeZipFolder = sanitizePathSegment(cleanName) || `zip_${Date.now()}`;
            const parts = cleanName.split('-').map(p => p.trim());
            if (parts.length >= 1) setSongName(parts[0]);
            if (parts.length >= 2) setArtist(parts[1]);
            setZipFolderName(safeZipFolder);
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
            const coverExt = String(file.name.split('.').pop() || 'jpg').toLowerCase();
            const folder = zipFolderName || `admin_${Date.now()}`;
            formData.append('fileName', `multitracks/admin/${folder}/cover/cover_admin.${coverExt}`);
            const res = await fetch(`${proxyBase}/api/upload`, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.url) { setCoverUrl(data.url); setCoverFileId(data.fileId); }
        } catch (err) { alert('Error al subir portada: ' + err.message); }
        finally { setIsUploadingCover(false); }
    };

    const uploadMtToB2 = async () => {
        if (!songName.trim()) return alert('Nombre requerido');
        if (!coverUrl) return alert('La portada es obligatoria.');
        if (!zipFolderName) return alert('Vuelve a cargar el ZIP para generar su carpeta de archivos.');
        setMtStep('uploading');
        const uploadedTracksInfo = [];
        try {
            const trackFolder = `multitracks/admin/${zipFolderName}/tracks`;
            for (let i = 0; i < fileList.length; i++) {
                const track = fileList[i];
                const formData = new FormData();
                formData.append('audioFile', track.blob);
                const safeTrackName = sanitizePathSegment(track.displayName) || `track_${i + 1}`;
                const b2Filename = `${trackFolder}/${String(i + 1).padStart(2, '0')}_${safeTrackName}.${track.extension}`;
                formData.append('fileName', b2Filename);
                formData.append('generatePreview', 'true');
                const uploadRes = await fetch(`${proxyBase}/api/upload`, { method: 'POST', body: formData });
                if (!uploadRes.ok) {
                    const errText = await uploadRes.text();
                    let errMsg = errText;
                    try {
                        const parsed = JSON.parse(errText);
                        errMsg = parsed?.error || parsed?.details || errText;
                    } catch {
                        // Keep raw text when backend returns non-JSON.
                    }
                    throw new Error(`Fallo al subir pista ${track.displayName}: ${errMsg}`);
                }
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
                formData.append('fileName', `multitracks/admin/${zipFolderName}/mix/PreviewMix.wav`);
                formData.append('generatePreview', 'true');
                const res = await fetch(`${proxyBase}/api/upload`, { method: 'POST', body: formData });
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
                priceCustomMix: parseFloat(priceCustomMix) || 0,
                priceWavTrack: parseFloat(priceWavTrack) || 0,
                priceMp3: parseFloat(priceMp3Track) || 0,
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
        setSongKey(''); setTempo(''); setTimeSignature('4/4');
        setPrice(String(pricing.wavPrice ?? 29.0));
        setPriceCustomMix(String(pricing.stemsPrice ?? 15.0));
        setPriceWavTrack(String(pricing.wavTrackPrice ?? 15.0));
        setPriceMp3Track(String(pricing.mp3Price ?? 9.0));
        setMtPriceTouched(false);
        setZipFolderName(''); setCoverUrl(''); setCoverFileId(''); setUploadProgress(0); setMtError('');
    };

    // ── Catálogo handlers ────────────────────────────────────────────────────
    const uploadToB2 = async (file, generatePreview = false) => {
        if (!file) return null;
        const formData = new FormData();
        const b2FileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        formData.append('audioFile', file);
        formData.append('fileName', b2FileName);
        if (generatePreview) formData.append('generatePreview', 'true');
        const res = await fetch(`${proxyBase}/api/upload`, { method: 'POST', body: formData });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Error subiendo'); }
        return await res.json();
    };

    const handleAddProduct = async (e) => {
        e.preventDefault(); setUploading(true);
        try {
            const coverRes = newProduct.coverFile ? await uploadToB2(newProduct.coverFile) : null;
            const coverUrl2 = coverRes ? coverRes.url : '';
            
            const audioRes = newProduct.audioFile ? await uploadToB2(newProduct.audioFile, true) : null;
            const audioUrl = audioRes ? audioRes.url : '';
            const mp3Url = audioRes && audioRes.mp3Url ? audioRes.mp3Url : '';
            const previewUrl = audioRes && audioRes.previewUrl ? audioRes.previewUrl : '';

            await addDoc(collection(db, 'songs'), { 
                name: newProduct.name, 
                artist: newProduct.artist, 
                priceWav: parseFloat(newProduct.priceWav) || 0,
                priceMp3: parseFloat(newProduct.priceMp3) || 0,
                // Mantener 'price' por retrocompatibilidad con la lista si es necesario
                price: parseFloat(newProduct.priceWav) || 0,
                coverUrl: coverUrl2, 
                audioUrl, 
                mp3Url,
                previewUrl,
                isSingle: true,
                forSale: true, 
                status: 'active', 
                userId: auth.currentUser?.uid || 'admin',
                userEmail: auth.currentUser?.email || 'admin',
                sellerName: 'Junior Lugo',
                createdAt: serverTimestamp() 
            });
            setIsAddingProduct(false);
            setNewProduct({ name: '', artist: '', priceWav: '', priceMp3: '', coverFile: null, audioFile: null });
            setPreviews({ ...previews, cover: null });
        } catch (err) { alert(err.message); } finally { setUploading(false); }
    };

    const handleAddPhoto = async (e) => {
        e.preventDefault(); if (!newPhoto.file) return; setUploading(true);
        try {
            const res = await uploadToB2(newPhoto.file);
            const url = res ? res.url : '';
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

    const handleUpdatePricing = async (e) => {
        e.preventDefault(); setUploading(true);
        try { 
            await setDoc(doc(db, 'settings', 'multitrack_pricing'), pricing); 
            alert('Precios actualizados globalmente.'); 
        }
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
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Precio WAV ($):</label>
                                    <input style={S.input} type="number" placeholder="Precio WAV" required value={newProduct.priceWav} onChange={e => setNewProduct({ ...newProduct, priceWav: e.target.value })} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Precio MP3 ($):</label>
                                    <input style={S.input} type="number" placeholder="Precio MP3" required value={newProduct.priceMp3} onChange={e => setNewProduct({ ...newProduct, priceMp3: e.target.value })} />
                                </div>
                            </div>
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

            {/* MODAL: RUTAS DE ARCHIVOS MT */}
            {routesModalSong && (
                <div style={S.overlay} onClick={() => setRoutesModalSong(null)}>
                    <div
                        style={{ ...S.modal, maxWidth: '780px', maxHeight: '80vh', overflowY: 'auto' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={{ marginBottom: '6px' }}>Rutas de archivos subidos</h2>
                        <p style={{ color: '#94a3b8', marginTop: 0, marginBottom: '18px' }}>
                            {routesModalSong.name} · {routesModalSong.artist}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {routesModalSong.coverUrl && (
                                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>Portada</div>
                                    <div style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>{routesModalSong.coverUrl}</div>
                                </div>
                            )}

                            {(routesModalSong.tracks || []).map((track, idx) => (
                                <div key={`${track.name || 'track'}_${idx}`} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px' }}>{track.name || `Track ${idx + 1}`}</div>
                                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Archivo original</div>
                                    <div style={{ fontSize: '0.85rem', marginBottom: '10px', wordBreak: 'break-all' }}>{track.url || 'Sin URL'}</div>

                                    {track.previewUrl && track.previewUrl !== track.url && (
                                        <>
                                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Preview</div>
                                            <div style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>{track.previewUrl}</div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setRoutesModalSong(null)} style={S.btnGhost}>Cerrar</button>
                        </div>
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
                    <button onClick={() => setActiveTab(activeTab === 'mt' ? 'mt' : 'mt')} style={S.sideBtn(activeTab === 'mt')}><Upload size={18} /> Subir MT</button>
                    <button onClick={() => setActiveTab('users')} style={S.sideBtn(activeTab === 'users')}><Users size={18} /> Usuarios</button>
                    <button onClick={() => setActiveTab('catalogoMT')} style={S.sideBtn(activeTab === 'catalogoMT')}><Music size={18} /> Catálogo MT</button>
                    <button onClick={() => setActiveTab('products')} style={S.sideBtn(activeTab === 'products')}><Music size={18} /> Catálogo Simple</button>
                    <button onClick={() => setActiveTab('gallery')} style={S.sideBtn(activeTab === 'gallery')}><ImageIcon size={18} /> Galería</button>
                    <button onClick={() => setActiveTab('portfolio')} style={S.sideBtn(activeTab === 'portfolio')}><Video size={18} /> Portafolio</button>
                    <button onClick={() => setActiveTab('sales')} style={S.sideBtn(activeTab === 'sales')}><DollarSign size={18} /> Ventas</button>
                    <button onClick={() => setActiveTab('pricing')} style={S.sideBtn(activeTab === 'pricing')}><CreditCard size={18} /> Precios MT</button>
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
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                                        <div style={{ background: 'rgba(0,188,212,0.08)', borderLeft: '4px solid #00bcd4', padding: '20px', borderRadius: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                                <FileText size={20} color="#00bcd4" />
                                                <span style={{ fontWeight: '900', color: '#00bcd4', textTransform: 'uppercase', fontSize: '0.9rem' }}>Instrucciones del ZIP</span>
                                            </div>
                                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.6' }}>
                                                <li>El archivo debe estar en formato <strong>.ZIP</strong></li>
                                                <li>Solo se admiten audios <strong>.WAV</strong> o <strong>.MP3</strong></li>
                                                <li>Incluye todas las pistas individuales (stems).</li>
                                                <li>No incluyas carpetas anidadas dentro del ZIP.</li>
                                            </ul>
                                        </div>

                                        <div style={{ background: 'rgba(139, 92, 246, 0.08)', borderLeft: '4px solid #8B5CF6', padding: '20px', borderRadius: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                                <ShieldCheck size={20} color="#8B5CF6" />
                                                <span style={{ fontWeight: '900', color: '#8B5CF6', textTransform: 'uppercase', fontSize: '0.9rem' }}>Convención de Nombres</span>
                                            </div>
                                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>
                                                Nombre del archivo:<br/>
                                                <strong style={{ color: 'white' }}>NOMBRE - ARTISTA - NOTA - TEMPO.zip</strong>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                                                Ejemplo: Celebra victorioso - Juan Carlos - Am - 98BPM.zip
                                            </div>
                                        </div>
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
                                    <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#00bcd4', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Secuencia WAV/ZIP (USD)</label>
                                        <input type="number" step="0.01" min="0" style={{ ...S.input, fontSize: '1.05rem', fontWeight: '900' }} value={price} onChange={e => { setPrice(e.target.value); setMtPriceTouched(true); }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#00bcd4', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>CustomMix WAV (USD)</label>
                                        <input type="number" step="0.01" min="0" style={{ ...S.input, fontSize: '1.05rem', fontWeight: '900' }} value={priceCustomMix} onChange={e => { setPriceCustomMix(e.target.value); setMtPriceTouched(true); }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#00bcd4', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Acompañamiento WAV (USD)</label>
                                        <input type="number" step="0.01" min="0" style={{ ...S.input, fontSize: '1.05rem', fontWeight: '900' }} value={priceWavTrack} onChange={e => { setPriceWavTrack(e.target.value); setMtPriceTouched(true); }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#00bcd4', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Acompañamiento MP3 (USD)</label>
                                        <input type="number" step="0.01" min="0" style={{ ...S.input, fontSize: '1.05rem', fontWeight: '900' }} value={priceMp3Track} onChange={e => { setPriceMp3Track(e.target.value); setMtPriceTouched(true); }} />
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
                                                    <img src={getProxyUrl(coverUrl)} alt="Cover" style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }} />
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

                {/* ── TAB: USUARIOS ── */}
                {activeTab === 'users' && (
                    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                        <header style={{ marginBottom: '40px' }}>
                            <h1 style={{ margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Gestión de Usuarios</h1>
                            <p style={{ color: '#64748b', margin: 0 }}>Administra los usuarios registrados y sus estadísticas.</p>
                        </header>

                        {/* Search & Sort Bar */}
                        <div style={{ background: '#080d1a', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                            <div style={{ position: 'relative', width: '350px' }}>
                                <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} size={18} />
                                <input 
                                    style={{ ...S.input, paddingLeft: '48px', margin: 0, height: '48px' }} 
                                    placeholder="Buscar por nombre o correo..." 
                                    value={usersSearch}
                                    onChange={e => setUsersSearch(e.target.value)}
                                />
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '700' }}>ORDENAR POR:</span>
                                <select 
                                    style={{ ...S.input, width: '180px', height: '48px', cursor: 'pointer' }}
                                    value={userSortField}
                                    onChange={e => setUserSortField(e.target.value)}
                                >
                                    <option value="createdAt">Fecha Registro</option>
                                    <option value="mtCount">Subidas (MT)</option>
                                </select>
                                <button 
                                    onClick={() => setUserSortOrder(userSortOrder === 'asc' ? 'desc' : 'asc')}
                                    style={{ ...S.btnGhost, padding: '12px' }}
                                >
                                    {userSortOrder === 'asc' ? <TrendingUp size={20} /> : <TrendingUp size={20} style={{ transform: 'rotate(180deg)' }} />}
                                </button>
                            </div>
                        </div>

                        {/* Users Table */}
                        <div style={{ background: '#080d1a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', overflow: 'hidden' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <tr>
                                            <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Usuario</th>
                                            <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Registro</th>
                                            <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Rol</th>
                                            <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>MT Subidos</th>
                                            <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users
                                            .map(u => {
                                                const count = products.filter(p => p.userId === u.id).length;
                                                return { ...u, mtCount: count };
                                            })
                                            .filter(u => {
                                                const s = usersSearch.toLowerCase();
                                                return !usersSearch || u.email?.toLowerCase().includes(s) || u.displayName?.toLowerCase().includes(s);
                                            })
                                            .sort((a, b) => {
                                                let valA = userSortField === 'createdAt' ? (a.createdAt?.toMillis() || 0) : a.mtCount;
                                                let valB = userSortField === 'createdAt' ? (b.createdAt?.toMillis() || 0) : b.mtCount;
                                                return userSortOrder === 'asc' ? valA - valB : valB - valA;
                                            })
                                            .map(user => (
                                                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                                                    <td style={{ padding: '20px 24px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#00A3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.2rem' }}>
                                                                {user.displayName?.[0] || user.email?.[0]?.toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>{user.displayName || 'Sin Nombre'}</div>
                                                                <div style={{ fontSize: '0.8rem', color: '#475569' }}>{user.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '20px 24px', color: '#94a3b8', fontSize: '0.85rem' }}>
                                                        {user.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '20px 24px' }}>
                                                        {user.isSeller ? (
                                                            <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '6px 14px', borderRadius: '30px', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase' }}>Vendedor</span>
                                                        ) : (
                                                            <span style={{ background: 'rgba(148,163,184,0.1)', color: '#94a3b8', padding: '6px 14px', borderRadius: '30px', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase' }}>Usuario</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                                                        <div style={{ padding: '10px', background: 'rgba(0, 163, 255, 0.05)', borderRadius: '12px', display: 'inline-block', minWidth: '40px', fontWeight: '900', color: '#00A3FF' }}>
                                                            {user.mtCount}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                                        <button 
                                                            onClick={() => navigate(`/seller-profile/${user.id}`)}
                                                            style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', transition: '0.2s' }}
                                                            title="Ver Perfil"
                                                        >
                                                            <ExternalLink size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
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
                                        <img src={getProxyUrl(p.coverUrl || '/logo.png')} style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: '800', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px' }}>{p.artist} · ${p.price}</div>
                                            <button
                                                onClick={() => setRoutesModalSong(p)}
                                                style={{ marginBottom: '8px', background: 'rgba(0,188,212,0.12)', color: '#00bcd4', border: '1px solid rgba(0,188,212,0.35)', borderRadius: '8px', padding: '4px 10px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}
                                            >
                                                Ver rutas
                                            </button>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                {p.key && <span style={{ background: 'rgba(0,163,255,0.15)', color: '#00A3FF', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700' }}>{p.key}</span>}
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
                                        <img src={getProxyUrl(p.coverUrl || '/logo.png')} style={{ width: '54px', height: '54px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
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
                                        <img src={getProxyUrl(g.url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

                {/* ── TAB: CONFIGURACIÓN DE PRECIOS ── */}
                {activeTab === 'pricing' && (
                    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <header style={{ marginBottom: '30px' }}>
                            <h1 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Precios de Multitracks</h1>
                            <p style={{ color: '#64748b', margin: 0 }}>Define los precios globales para las opciones de compra de multitracks.</p>
                        </header>
                        
                        <div style={{ background: '#080d1a', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', maxWidth: '650px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                            <form onSubmit={handleUpdatePricing} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(139, 92, 246, 0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ element: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', display: 'flex' }}>
                                            <Upload size={18} color="#8B5CF6" />
                                            <label style={{ fontWeight: '900', fontSize: '1rem' }}>Multitrack (WAV/ZIP)</label>
                                        </div>
                                        <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>Paquete completo de pistas individuales.</p>
                                    </div>
                                    <div style={{ position: 'relative', width: '130px' }}>
                                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', color: '#8B5CF6' }}>$</span>
                                        <input type="number" step="0.01" value={pricing.wavPrice} onChange={e => setPricing({ ...pricing, wavPrice: parseFloat(e.target.value) })} style={{ ...S.input, paddingLeft: '25px', textAlign: 'right', fontWeight: '900' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 188, 212, 0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(0, 188, 212, 0.1)' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ element: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', display: 'flex' }}>
                                            <Music2 size={18} color="#00bcd4" />
                                            <label style={{ fontWeight: '900', fontSize: '1rem' }}>CustomMix (Stems)</label>
                                        </div>
                                        <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>Grupos de instrumentos (Drums, Bass, etc).</p>
                                    </div>
                                    <div style={{ position: 'relative', width: '130px' }}>
                                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', color: '#00bcd4' }}>$</span>
                                        <input type="number" step="0.01" value={pricing.stemsPrice} onChange={e => setPricing({ ...pricing, stemsPrice: parseFloat(e.target.value) })} style={{ ...S.input, paddingLeft: '25px', textAlign: 'right', fontWeight: '900' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ element: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', display: 'flex' }}>
                                            <Music size={18} color="#10b981" />
                                            <label style={{ fontWeight: '900', fontSize: '1rem' }}>Acompañamiento (MP3)</label>
                                        </div>
                                        <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>Archivo MP3 de alta calidad sin voz.</p>
                                    </div>
                                    <div style={{ position: 'relative', width: '130px' }}>
                                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', color: '#10b981' }}>$</span>
                                        <input type="number" step="0.01" value={pricing.mp3Price} onChange={e => setPricing({ ...pricing, mp3Price: parseFloat(e.target.value) })} style={{ ...S.input, paddingLeft: '25px', textAlign: 'right', fontWeight: '900' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(241, 196, 15, 0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(241, 196, 15, 0.1)' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ element: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', display: 'flex' }}>
                                            <Music size={18} color="#f1c40f" />
                                            <label style={{ fontWeight: '900', fontSize: '1rem' }}>Acompañamiento (WAV)</label>
                                        </div>
                                        <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>Archivo WAV de alta fidelidad sin voz.</p>
                                    </div>
                                    <div style={{ position: 'relative', width: '130px' }}>
                                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', color: '#f1c40f' }}>$</span>
                                        <input type="number" step="0.01" value={pricing.wavTrackPrice || 15.00} onChange={e => setPricing({ ...pricing, wavTrackPrice: parseFloat(e.target.value) })} style={{ ...S.input, paddingLeft: '25px', textAlign: 'right', fontWeight: '900' }} />
                                    </div>
                                </div>

                                <button type="submit" disabled={uploading} style={{ ...S.btnPurple, padding: '16px', marginTop: '10px', fontSize: '1.1rem', fontWeight: '900' }}>
                                    {uploading ? 'GUARDANDO...' : 'ACTUALIZAR PRECIOS GLOBALES'}
                                </button>
                            </form>
                        </div>
                    </div>
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

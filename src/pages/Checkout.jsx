import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { ArrowLeft, X, Loader2, CheckCircle2, ShieldCheck, LogOut, Globe, Download, Trash2 } from 'lucide-react';
import JSZip from 'jszip';
import { getDoc, setDoc, doc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import Footer from '../components/Footer';

const PAYPAL_CLIENT_ID = 'AUpK2JoMNn5YN5Yp0T-oyI3rAW63sBXc-LZ4EaC0VeOPjfJzOQWACN6bo2DNqhtq7z2T22Ob8_c7EdkO';

const PayPalCheckoutForm = ({ total, subtotal, discount, cart, onPaymentSuccess, onError }) => (
    <div>
        {/* Resumen de order */}
        <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Subtotal:</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>${subtotal}</span>
            </div>
            {parseFloat(discount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#166534' }}>
                    <span style={{ fontWeight: '600' }}>Descuento:</span>
                    <span style={{ fontWeight: '700' }}>-${discount}</span>
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: '800', color: '#0f172a' }}>Total a pagar:</span>
                <span style={{ fontWeight: '900', color: '#0000FF' }}>${total}</span>
            </div>
        </div>

        {/* Botones PayPal */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h4 style={{ color: '#0f172a', marginBottom: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}>
                {/* PayPal logo color */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" fill="#003087"/>
                    <path d="M19.28 7.2c-.078.5-.17 1.006-.288 1.526-1.016 5.225-4.393 7.092-8.73 7.092H8.07c-.53 0-.977.386-1.06.91l-1.12 7.106-.32 2.026a.637.637 0 0 0 .629.73h4.414c.466 0 .862-.338.934-.798l.038-.198.741-4.694.047-.258c.072-.46.468-.797.934-.797h.588c3.808 0 6.79-1.548 7.66-6.02.364-1.869.176-3.43-.785-4.527a3.73 3.73 0 0 0-1.49-.9z" fill="#0070ba"/>
                </svg>
                Pagar con PayPal
            </h4>

            <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD' }}>
                <PayPalButtons
                    style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay', height: 50 }}
                    createOrder={(_data, actions) =>
                        actions.order.create({
                            purchase_units: [{
                                amount: { value: String(total), currency_code: 'USD' },
                                description: cart.length > 1
                                    ? `${cart.length} pistas multitracks - Junior Lugo`
                                    : `${cart[0]?.name || 'Pista'} - Junior Lugo Producciones`
                            }]
                        })
                    }
                    onApprove={async (_data, actions) => {
                        const details = await actions.order.capture();
                        if (details.status === 'COMPLETED') onPaymentSuccess();
                    }}
                    onError={onError}
                    onCancel={() => console.log('PayPal: pago cancelado por usuario')}
                />
            </PayPalScriptProvider>

            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <ShieldCheck size={14} /> Pago 100% seguro vía PayPal
            </p>
        </div>
    </div>
);

export default function Checkout() {
    const navigate = useNavigate();
    const [cart, setCart] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [purchasedSongs, setPurchasedSongs] = useState([]);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });

    useEffect(() => {
        const savedCart = localStorage.getItem('lugo_cart');
        if (savedCart) {
            try { setCart(JSON.parse(savedCart)); } catch { setCart([]); }
        }

        const unsub = auth.onAuthStateChanged(user => {
            setCurrentUser(user);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    const cartSubtotal = cart.reduce((acc, item) => acc + (parseFloat(item.price) || 9.99), 0);
    const discountAmount = appliedCoupon ? (cartSubtotal * (appliedCoupon.discount / 100)) : 0;
    const cartTotal = (cartSubtotal - discountAmount).toFixed(2);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const applyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsValidatingCoupon(true);
        try {
            const q = query(collection(db, 'coupons'), where('code', '==', couponCode.trim().toUpperCase()));
            const snap = await getDocs(q);
            if (snap.empty) {
                showToast('Cupón no válido', 'error');
            } else {
                const couponData = snap.docs[0].data();
                setAppliedCoupon(couponData);
                showToast(`¡Cupón aplicado! ${couponData.discount}% de descuento`);
            }
        } catch (err) {
            console.error('Coupon error:', err);
            showToast('Error al validar cupón', 'error');
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const removeFromCart = (cartId) => {
        const newCart = cart.filter(item => item.cartId !== cartId);
        setCart(newCart);
        localStorage.setItem('lugo_cart', JSON.stringify(newCart));
        if (newCart.length === 0) navigate('/store');
    };

    const handlePaymentSuccess = async () => {
        try {
            const songIds = cart.map(i => i.id);
            const purchasedWithMeta = [];
            for (const item of cart) {
                const sDoc = await getDoc(doc(db, 'songs', item.id));
                if (sDoc.exists()) {
                    purchasedWithMeta.push({ 
                        ...sDoc.data(), 
                        id: sDoc.id,
                        purchaseVariant: item.variantName,
                        purchaseMeta: item.meta,
                        purchaseFormat: item.format,
                        cartId: item.cartId // Para Key
                    });
                }
            }
            setPurchasedSongs(purchasedWithMeta);

            // Guardamos con setDoc {merge: true} para crear el doc si no existe
            await setDoc(doc(db, 'users', currentUser.uid), {
                purchasedSongs: arrayUnion(...songIds)
            }, { merge: true });

            try {
                await addDoc(collection(db, 'sales'), {
                    userId: currentUser.uid,
                    userEmail: currentUser.email,
                    userName: currentUser.displayName || 'Usuario',
                    songIds,
                    songs: cart.map(item => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        variant: item.variantName || 'Secuencia',
                        format: item.format || 'ZIP'
                    })),
                    total: parseFloat(cartTotal),
                    createdAt: serverTimestamp(),
                    status: 'completed',
                    paymentMethod: 'paypal'
                });
            } catch (salesErr) {
                console.error('Error recording sale:', salesErr);
            }

            setCart([]);
            localStorage.removeItem('lugo_cart');
            setIsSuccess(true);
        } catch (err) {
            console.error('Error updating purchase:', err);
            setIsSuccess(true);
        }
    };

    const handlePayPalError = (err) => {
        console.error('PayPal error:', err);
        showToast('Error en el pago con PayPal. Intenta de nuevo.', 'error');
    };

    const downloadAsZip = async (song) => {
        if (isDownloading) return;
        setIsDownloading(true);
        const zip = new JSZip();
        
        // 1. Obtener todas las pistas de la canción
        let allTracks = (song.tracks || []).filter(t => t.name !== '__PreviewMix');
        if (allTracks.length === 0 && song.audioUrl) {
            allTracks = [{ name: song.name, url: song.audioUrl }];
        }

        const isCustom = song.purchaseVariant?.toLowerCase().includes('personalizado') || song.purchaseVariant?.toLowerCase().includes('custom');
        const isTrackOnly = song.purchaseVariant?.toLowerCase().includes('pista') || song.purchaseVariant?.toLowerCase().includes('acompañamiento');

        const devProxy = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:3001' : 'https://mixernew-production.up.railway.app';

        try {
            if (isCustom || isTrackOnly) {
                // Caso: MEZCLA (Custom o Pista)
                showToast(`Generando ${isCustom ? 'Mezcla Personalizada' : 'Pista'}...`, 'info');
                
                // Necesitamos cargar los buffers en el motor offline
                await audioEngine.init();
                await audioEngine.clear();
                
                const selectedNames = isCustom ? (song.purchaseMeta?.selectedTracks || []) : null;
                
                for (let i = 0; i < allTracks.length; i++) {
                    const track = allTracks[i];
                    // Si es custom y no está en la lista, saltamos
                    if (isCustom && selectedNames.length > 0 && !selectedNames.includes(track.name)) continue;
                    
                    setDownloadProgress({ current: i + 1, total: allTracks.length });
                    const res = await fetch(`${devProxy}/api/download?url=${encodeURIComponent(track.url)}`);
                    const blob = await res.blob();
                    await audioEngine.addTrack(track.name, null, blob);
                }

                const renderedBlob = await audioEngine.renderMix();
                if (renderedBlob) {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(renderedBlob);
                    link.download = `${song.name} - ${isCustom ? 'Custom Mix' : 'Pista'}.wav`;
                    link.click();
                }
            } else {
                // Caso: MULTITRACK / STEMS (ZIP de archivos individuales)
                setDownloadProgress({ current: 0, total: allTracks.length });
                for (let i = 0; i < allTracks.length; i++) {
                    const track = allTracks[i];
                    const res = await fetch(`${devProxy}/api/download?url=${encodeURIComponent(track.url)}`);
                    if (!res.ok) throw new Error(`Fallo al descargar ${track.name}`);
                    const blob = await res.blob();
                    const ext = track.url.split('.').pop().split('?')[0] || 'wav';
                    zip.file(`${track.name}.${ext}`, blob);
                    setDownloadProgress(p => ({ ...p, current: i + 1 }));
                }
                const content = await zip.generateAsync({ type: 'blob' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(content);
                link.download = `${song.name} - ${song.purchaseVariant || 'Multitrack'}.zip`;
                link.click();
            }
        } catch (err) {
            console.error('Error en descarga:', err);
            showToast('Error al generar archivos: ' + err.message, 'error');
        } finally {
            setIsDownloading(false);
            setDownloadProgress({ current: 0, total: 0 });
        }
    };

    /* ── Loading ── */
    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white' }}>
                <Loader2 size={50} className="animate-spin" color="#0000FF" />
                <p style={{ marginTop: '20px', fontWeight: '600' }}>Cargando tu carrito...</p>
            </div>
        );
    }

    /* ── Not logged in ── */
    if (!currentUser && !isSuccess) {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white', padding: '20px', textAlign: 'center' }}>
                <ShieldCheck size={60} color="#94a3b8" style={{ marginBottom: '20px' }} />
                <h2 style={{ fontSize: '2rem', fontWeight: '900' }}>Inicio de sesión requerido</h2>
                <p style={{ color: '#94a3b8', maxWidth: '400px', margin: '15px 0 30px' }}>Para completar tu compra de forma segura, necesitamos que inicies sesión en tu cuenta.</p>
                <button onClick={() => navigate('/dashboard')} className="btn-teal" style={{ padding: '16px 40px' }}>Iniciar Sesión / Registrarse</button>
            </div>
        );
    }

    /* ── Success screen ── */
    if (isSuccess) {
        return (
            <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ maxWidth: '600px', width: '100%', background: 'white', padding: '50px 40px', borderRadius: '32px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}>
                    <div style={{ width: '80px', height: '80px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <CheckCircle2 size={40} color="#22c55e" />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '16px', letterSpacing: '-1px' }}>¡Pago Exitoso!</h1>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '30px', lineHeight: '1.6' }}>
                        Tus pistas ya están listas. Puedes descargarlas como ZIP de alta calidad:
                    </p>

                    <div style={{ background: '#f8fafc', borderRadius: '24px', padding: '20px', marginBottom: '40px', border: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <h4 style={{ margin: '0 0 15px', fontSize: '0.9rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Archivos Disponibles:</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {purchasedSongs.map(song => (
                                <div key={song.id} style={{ background: 'white', padding: '15px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', overflow: 'hidden', flexShrink: 0 }}>
                                            <img src={song.coverUrl} alt={song.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>{song.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{(song.tracks?.length || 1) - 1} pistas individuales</div>
                                        </div>
                                    </div>
                                    <button
                                        disabled={isDownloading}
                                        onClick={() => downloadAsZip(song)}
                                        style={{ background: '#0f172a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: isDownloading ? 0.6 : 1 }}
                                    >
                                        <Download size={16} />
                                        {isDownloading ? `Bajando ${downloadProgress.current}/${downloadProgress.total}` : 'ZIP'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <button onClick={() => navigate('/dashboard')} className="btn-teal" style={{ padding: '18px', fontSize: '1.1rem', fontWeight: '900' }}>Ir a mi Biblioteca</button>
                        <button onClick={() => navigate('/store')} style={{ background: 'transparent', border: 'none', color: '#64748b', fontWeight: '700', cursor: 'pointer' }}>Seguir comprando</button>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Main checkout ── */
    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', color: '#0f172a', fontFamily: '"Outfit", sans-serif' }}>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
                    background: '#1e293b', border: `1px solid ${toast.type === 'error' ? '#ef4444' : '#0000FF'}`,
                    color: 'white', padding: '12px 24px', borderRadius: '50px', zIndex: 5000,
                    boxShadow: '0 10px 30px rgba(0,0,10,0.5)', display: 'flex', alignItems: 'center', gap: '12px',
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: toast.type === 'error' ? '#ef4444' : '#00d2d3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {toast.type === 'error' ? <X size={14} color="white" /> : <CheckCircle2 size={16} color="white" />}
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{toast.message}</span>
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from { transform: translate(-50%, 50px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `}</style>

            {/* Nav */}
            <nav style={{ padding: '15px 60px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1000 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                    <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <img src="/logo.png" alt="Junior Lugo Logo" style={{ height: '32px', objectFit: 'contain' }} />
                    </div>
                    <div onClick={() => navigate('/store')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700', color: '#64748b', fontSize: '0.9rem', background: '#f1f5f9', padding: '8px 16px', borderRadius: '30px' }}>
                        <ArrowLeft size={16} /> <span className="hide-mobile">Volver a la Tienda</span>
                    </div>
                </div>

                <div style={{ fontSize: '1.2rem', fontWeight: '900', letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '10px' }} className="hide-mobile">
                    <img src="/logo.png" alt="Junior Lugo" style={{ height: '24px' }} /> CHECKOUT
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: '700', fontSize: '0.85rem' }} className="hide-mobile">
                        <ShieldCheck size={18} /> Pago Seguro
                    </div>

                    {currentUser && (
                        <div style={{ position: 'relative' }}>
                            <div onClick={() => setShowDropdown(!showDropdown)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#f1f5f9', padding: '4px 4px 4px 10px', borderRadius: '30px', border: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }} className="hide-mobile">{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#0000FF,#000077)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.75rem', color: 'white' }}>
                                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                                </div>
                            </div>
                            {showDropdown && (
                                <div style={{ position: 'absolute', top: '45px', right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', width: '200px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 2000 }}>
                                    <div onClick={() => navigate('/dashboard')} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#475569', fontSize: '0.9rem', fontWeight: '600', borderBottom: '1px solid #f1f5f9' }}>
                                        <Globe size={16} color="#94a3b8" /> Dashboard
                                    </div>
                                    <div onClick={() => auth.signOut()} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#ef4444', fontSize: '0.9rem', fontWeight: '600' }}>
                                        <LogOut size={16} /> Cerrar Sesión
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Grid */}
            <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '60px' }}>

                {/* Columna Izquierda: Carrito */}
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        Tu Carrito <span style={{ background: '#0000FF', color: 'white', fontSize: '1rem', padding: '2px 10px', borderRadius: '20px' }}>{cart.length}</span>
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {cart.map(item => (
                            <div key={item.id} style={{ background: 'white', padding: '20px', borderRadius: '20px', display: 'flex', gap: '20px', alignItems: 'center', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ width: '70px', height: '70px', borderRadius: '12px', overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 }}>
                                    <img src={item.coverUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>{item.name}</h4>
                                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>{item.artist}</p>
                                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.65rem', background: '#f1f5f9', color: '#0000FF', padding: '2px 8px', borderRadius: '4px', fontWeight: '900', textTransform: 'uppercase' }}>{item.variantName || 'Secuencia'}</span>
                                        <span style={{ fontSize: '0.65rem', background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>{item.format || 'ZIP'}</span>
                                        {item.meta?.selectedTracks && (
                                            <div style={{ width: '100%', marginTop: '4px', fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>
                                                Pistas: {item.meta.selectedTracks.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: '900', fontSize: '1.2rem', color: '#0f172a' }}>${item.price}</div>
                                    <button 
                                        onClick={() => removeFromCart(item.cartId)} 
                                        style={{ 
                                            background: 'rgba(239,68,68,0.1)', 
                                            border: 'none', 
                                            color: '#ef4444', 
                                            fontSize: '0.75rem', 
                                            fontWeight: '800', 
                                            cursor: 'pointer', 
                                            padding: '6px 12px',
                                            borderRadius: '10px',
                                            marginTop: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <Trash2 size={14} /> Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Cupón */}
                    <div style={{ marginTop: '40px', padding: '30px', background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', fontWeight: '800' }}>¿Tienes un cupón?</h4>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                value={couponCode}
                                onChange={e => setCouponCode(e.target.value)}
                                placeholder="Ingresa tu código..."
                                style={{ flex: 1, padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem' }}
                            />
                            <button
                                onClick={applyCoupon}
                                disabled={isValidatingCoupon || !couponCode.trim()}
                                style={{ background: '#0f172a', color: 'white', border: 'none', padding: '0 20px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', opacity: isValidatingCoupon ? 0.7 : 1 }}
                            >
                                {isValidatingCoupon ? '...' : 'Aplicar'}
                            </button>
                        </div>
                        {appliedCoupon && (
                            <div style={{ marginTop: '15px', padding: '10px 15px', background: '#f0fdf4', borderRadius: '10px', color: '#166534', fontSize: '0.85rem', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Cupón {appliedCoupon.code} aplicado</span>
                                <span>-{appliedCoupon.discount}%</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Columna Derecha: PayPal */}
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '30px' }}>Checkout</h2>

                    {cart.length > 0 ? (
                        <PayPalCheckoutForm
                            total={cartTotal}
                            subtotal={cartSubtotal.toFixed(2)}
                            discount={discountAmount.toFixed(2)}
                            cart={cart}
                            onPaymentSuccess={handlePaymentSuccess}
                            onError={handlePayPalError}
                        />
                    ) : (
                        <div style={{ background: 'white', padding: '60px', borderRadius: '24px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                            <p style={{ color: '#64748b' }}>Tu carrito está vacío.</p>
                            <button onClick={() => navigate('/store')} className="btn-teal" style={{ marginTop: '20px', padding: '12px 30px' }}>Ver Tienda</button>
                        </div>
                    )}

                    <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px' }}>
                            <ShieldCheck size={24} color="#22c55e" />
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b' }}>Protección al Comprador</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px' }}>
                            <CheckCircle2 size={24} color="#8B5CF6" />
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b' }}>Acceso Instantáneo</span>
                        </div>
                    </div>
                </div>

            </main>

            <Footer />
        </div>
    );
}

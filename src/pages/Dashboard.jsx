import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDocs } from 'firebase/firestore';
import { Search, ShoppingCart, Play, Music2, CreditCard, User, LogOut, Home, KeyRound, ChevronLeft, ChevronRight, Activity, ShieldCheck, Zap, X } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';




export default function Dashboard() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('purchases');
    const [currentUser, setCurrentUser] = useState(null);
    const [userSongs, setUserSongs] = useState([]);

    useEffect(() => {
        const unsubAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                setCurrentUser(user);

                // Purchased Songs
                onSnapshot(doc(db, 'users', user.uid), (userSnap) => {
                    const purchases = userSnap.data()?.purchasedSongs || [];
                    if (purchases.length > 0) {
                        const q = query(collection(db, 'songs'), where('__name__', 'in', purchases.slice(0, 10))); // Simple subset for example
                        getDocs(q).then(snap => {
                            const songs = [];
                            snap.forEach(d => songs.push({ id: d.id, ...d.data() }));
                            setUserSongs(songs);
                        });
                    } else {
                        setUserSongs([]);
                    }
                });
            } else {
                navigate('/');
            }
        });
        return () => unsubAuth();
    }, [navigate]);




    const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Usuario';

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', display: 'flex', fontFamily: '"Inter", sans-serif' }}>
            {/* SIDEBAR */}
            <aside style={{ width: '280px', backgroundColor: '#020617', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', padding: '30px 20px', position: 'fixed', bottom: 0, top: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px', paddingLeft: '10px' }}>
                    <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: 'white' }}>JUNIOR<span style={{ color: '#8B5CF6' }}>LUGO</span></h1>
                    </div>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                        { id: 'home', label: t('inicio'), icon: <Home size={20} />, onClick: () => navigate('/') },
                        { id: 'purchases', label: t('misCompras'), icon: <Music2 size={20} /> },
                        { id: 'billing', label: t('metodoPago'), icon: <CreditCard size={20} /> },
                        { id: 'profile', label: t('miInfo'), icon: <User size={20} /> },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={item.onClick ? item.onClick : () => setActiveTab(item.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px',
                                background: activeTab === item.id ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                border: 'none', color: activeTab === item.id ? '#8B5CF6' : '#94a3b8',
                                textAlign: 'left', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s'
                            }}
                        >
                            {item.icon} {item.label}
                        </button>
                    ))}
                    
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '15px 0' }} />

                    <button onClick={() => navigate('/store')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', background: 'transparent', border: 'none', color: '#94a3b8', textAlign: 'left', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}>
                        <ShoppingCart size={20} /> Tienda de Pistas
                    </button>

                    <button onClick={() => auth.signOut()} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', background: 'transparent', border: 'none', color: '#ef4444', textAlign: 'left', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s', marginTop: 'auto' }}>
                        <LogOut size={20} /> Cerrar Sesión
                    </button>
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <main style={{ marginLeft: '280px', flex: 1, padding: '40px 60px', maxWidth: '1200px' }}>
                <header style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0 0 8px' }}>
                        {activeTab === 'purchases' ? 'Mis Compras' :
                         activeTab === 'billing' ? 'Método de Pago' : 'Mi Información'}
                    </h1>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '1.1rem' }}>
                        {activeTab === 'purchases' ? 'Gestiona tus secuencias adquiridas.' : 
                         activeTab === 'billing' ? 'Configura tu facturación.' :
                         'Tus datos personales.'}
                    </p>
                </header>

                <div style={{ minHeight: '600px' }}>
                    {activeTab === 'purchases' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                            {userSongs.length > 0 ? userSongs.map(song => (
                                <div key={song.id} style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ height: '140px', background: '#0f172a', borderRadius: '8px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Music2 size={40} color="#334155" />
                                    </div>
                                    <h3 style={{ margin: '0 0 5px' }}>{song.name}</h3>
                                    <p style={{ color: '#64748b', margin: '0 0 15px' }}>{song.artist}</p>
                                    <button onClick={() => navigate('/mixer/' + song.id)} style={{ width: '100%', padding: '10px', background: '#8B5CF6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>ABRIR MIXER</button>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '100px 0', opacity: 0.5 }}>No has comprado pistas aún.</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div style={{ background: '#1e293b', padding: '30px', borderRadius: '12px', maxWidth: '600px' }}>
                            <h3 style={{ marginBottom: '20px' }}>Métodos de Pago</h3>
                            <div style={{ border: '1px dashed rgba(255,255,255,0.1)', padding: '30px', textAlign: 'center', borderRadius: '10px', marginBottom: '30px' }}>
                                <p style={{ color: '#64748b' }}>No tienes métodos de pago guardados.</p>
                                <button className="btn-teal" style={{ background: '#8B5CF6', marginTop: '15px' }}>Administrar en Checkout</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div style={{ background: '#1e293b', padding: '30px', borderRadius: '12px', maxWidth: '600px' }}>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>{displayName[0]}</div>
                                <div>
                                    <h3 style={{ margin: 0 }}>{displayName}</h3>
                                    <p style={{ margin: 0, color: '#64748b' }}>{currentUser?.email}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '5px' }}>NOMBRE</label>
                                    <input type="text" defaultValue={displayName} style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }} />
                                </div>
                                <button className="btn-teal" style={{ background: '#8B5CF6', width: 'fit-content' }}>Guardar Cambios</button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

        </div>
    );
}




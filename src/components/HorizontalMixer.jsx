import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Volume2, VolumeX, Headphones, Music, Mic2, Disc, Layers } from 'lucide-react';

// ── Per-track mini waveform canvas ──────────────────────────────────────────
const TrackWaveform = ({ trackId, color, muted, progress }) => {
    const canvasRef = useRef(null);
    const peaksRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        const extract = async () => {
            try {
                const { audioEngine } = await import('../AudioEngine');
                // Wait a tick for engine to be loaded
                await new Promise(r => setTimeout(r, 200));

                const meta = audioEngine.tracks?.get(trackId) || audioEngine._trackMeta?.get(trackId);
                const buffer = meta?.buffer;
                if (!buffer || cancelled) return;

                const W = canvasRef.current?.offsetWidth || 300;
                const data = buffer.getChannelData(0);
                const step = Math.max(1, Math.floor(data.length / W));
                const peaks = new Float32Array(W);
                for (let i = 0; i < W; i++) {
                    let max = 0;
                    for (let j = 0; j < step; j++) {
                        const v = Math.abs(data[i * step + j] || 0);
                        if (v > max) max = v;
                    }
                    peaks[i] = max;
                }
                // Normalize
                let norm = 0;
                for (let i = 0; i < peaks.length; i++) if (peaks[i] > norm) norm = peaks[i];
                if (norm > 0) for (let i = 0; i < peaks.length; i++) peaks[i] = (peaks[i] / norm) * 0.9 + 0.05;

                peaksRef.current = peaks;
                drawWaveform(peaks, progress, color, muted);
            } catch (e) {
                // No buffer yet — draw placeholder
                const W = canvasRef.current?.offsetWidth || 300;
                const peaks = new Float32Array(W);
                for (let i = 0; i < W; i++) {
                    peaks[i] = 0.08 + Math.abs(Math.sin((i / W) * Math.PI * 12)) * 0.3 + Math.random() * 0.05;
                }
                peaksRef.current = peaks;
                drawWaveform(peaks, progress, color, muted);
            }
        };

        extract();
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trackId]);

    const drawWaveform = useCallback((peaks, prog, col, mut) => {
        const canvas = canvasRef.current;
        if (!canvas || !peaks) return;
        const dpr = window.devicePixelRatio || 1;
        const W = canvas.offsetWidth;
        const H = canvas.offsetHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.clearRect(0, 0, W, H);

        const centerY = H / 2;
        const playheadX = typeof prog === 'number' ? (prog * W) : -1;

        for (let x = 0; x < peaks.length; x++) {
            const val = peaks[x];
            const h = Math.max(1, val * (H * 0.9));
            const played = x < playheadX;
            ctx.fillStyle = mut
                ? 'rgba(100,116,139,0.3)'
                : played
                    ? col
                    : `${col}55`;
            ctx.fillRect(x, centerY - h / 2, 1, h);
        }

        // Playhead line
        if (playheadX >= 0 && playheadX < W) {
            ctx.fillStyle = 'rgba(255,82,82,0.9)';
            ctx.fillRect(playheadX - 1, 0, 2, H);
        }
    }, []);

    // Redraw when progress / muted changes
    useEffect(() => {
        if (peaksRef.current) drawWaveform(peaksRef.current, progress, color, muted);
    }, [progress, color, muted, drawWaveform]);

    return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block', borderRadius: '4px' }}
        />
    );
};

// ── LED indicator ─────────────────────────────────────────────────────────────
const Led = ({ active, color }) => (
    <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        flexShrink: 0,
        background: active ? color : 'rgba(255,255,255,0.1)',
        boxShadow: active ? `0 0 6px 2px ${color}` : 'none',
        transition: 'background 0.15s, box-shadow 0.15s',
    }} />
);

// ── Main exported component ───────────────────────────────────────────────────
export const HorizontalMixer = ({ tracks, onVolumeChange, onMuteToggle, onSoloToggle, onPanChange, progress }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.05)',
        width: '100%',
    }}>
        {tracks.map(track => (
            <HorizontalTrack
                key={track.id}
                track={track}
                onVolumeChange={onVolumeChange}
                onMuteToggle={onMuteToggle}
                onSoloToggle={onSoloToggle}
                onPanChange={onPanChange}
                progress={progress}
            />
        ))}
    </div>
);

// ── Single track row ──────────────────────────────────────────────────────────
const HorizontalTrack = ({ track, onVolumeChange, onMuteToggle, onSoloToggle, onPanChange, progress }) => {
    const getIcon = (name) => {
        const n = (name || '').toLowerCase();
        if (n.includes('vox') || n.includes('voz') || n.includes('vocal')) return <Mic2 size={14} />;
        if (n.includes('drum') || n.includes('bat')) return <Disc size={14} />;
        if (n.includes('guit') || n.includes('git')) return <Music size={14} />;
        if (n.includes('bass') || n.includes('bajo')) return <Layers size={14} />;
        return <Headphones size={14} />;
    };

    const getColor = (name) => {
        const n = (name || '').toLowerCase();
        if (n.includes('drum') || n.includes('bat')) return '#94a3b8';
        if (n.includes('bass') || n.includes('bajo')) return '#a855f7';
        if (n.includes('guit') || n.includes('git')) return '#f87171';
        if (n.includes('vox') || n.includes('voz') || n.includes('vocal')) return '#38bdf8';
        if (n.includes('piano') || n.includes('key') || n.includes('kbd')) return '#34d399';
        if (n.includes('brass') || n.includes('horn') || n.includes('trp')) return '#fb923c';
        if (n.includes('string') || n.includes('violin') || n.includes('cello')) return '#f9a8d4';
        if (n.includes('click') || n.includes('guide') || n.includes('cue')) return '#64748b';
        return '#00d2d3';
    };

    const color = getColor(track.name);
    const isActive = !track.muted && !track.solo === false ? true : !track.muted;

    // Normalized progress 0–1 for waveform
    const waveProgress = typeof progress === 'number' ? ((progress - 20) / 20) : null;

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '160px 60px 1fr 40px 70px',
            alignItems: 'center',
            padding: '7px 16px',
            gap: '12px',
            background: 'rgba(15,23,42,0.5)',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            minHeight: '58px',
        }}>
            {/* LED + Icon + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <Led active={isActive} color={color} />
                <div style={{
                    width: '22px', height: '22px', borderRadius: '5px', flexShrink: 0,
                    background: track.muted ? '#1e293b' : `${color}22`,
                    border: `1px solid ${track.muted ? '#334155' : color}55`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: track.muted ? '#475569' : color,
                }}>
                    {getIcon(track.name)}
                </div>
                <span style={{
                    fontSize: '0.78rem', fontWeight: '700',
                    color: track.muted ? '#475569' : 'white',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {track.name}
                </span>
            </div>

            {/* Pan */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '46px', fontSize: '0.5rem', color: '#475569', fontWeight: '800' }}>
                    <span>L</span><span>R</span>
                </div>
                <input
                    type="range" min="-1" max="1" step="0.1"
                    value={track.pan || 0}
                    onChange={e => onPanChange(track.id, parseFloat(e.target.value))}
                    style={{ width: '46px', height: '3px', accentColor: '#94a3b8' }}
                />
            </div>

            {/* Waveform + Volume overlay */}
            <div style={{ position: 'relative', height: '34px', borderRadius: '6px', overflow: 'hidden', background: 'rgba(0,0,0,0.3)' }}>
                <TrackWaveform
                    trackId={track.id}
                    color={color}
                    muted={track.muted}
                    progress={waveProgress}
                />
                {/* Volume fill overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: track.muted
                        ? 'rgba(0,0,0,0.5)'
                        : `linear-gradient(to right, transparent ${Math.round(track.volume * 100)}%, rgba(0,0,0,0.55) ${Math.round(track.volume * 100)}%)`,
                    pointerEvents: 'none',
                    transition: 'background 0.1s',
                }} />
                <input
                    type="range" min="0" max="1" step="0.01"
                    value={track.volume}
                    onChange={e => onVolumeChange(track.id, parseFloat(e.target.value))}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
                />
            </div>

            {/* Vol % */}
            <div style={{ fontSize: '0.62rem', fontWeight: '900', color: '#475569', textAlign: 'center' }}>
                {Math.round(track.volume * 100)}
            </div>

            {/* M / S buttons */}
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                <button
                    onClick={() => onMuteToggle(track.id)}
                    style={{
                        width: '28px', height: '28px', borderRadius: '6px', border: 'none',
                        background: track.muted ? '#ef4444' : 'rgba(255,255,255,0.05)',
                        color: track.muted ? 'white' : '#64748b',
                        cursor: 'pointer', fontSize: '10px', fontWeight: '900',
                    }}
                >M</button>
                <button
                    onClick={() => onSoloToggle(track.id)}
                    style={{
                        width: '28px', height: '28px', borderRadius: '6px', border: 'none',
                        background: track.solo ? '#f59e0b' : 'rgba(255,255,255,0.05)',
                        color: track.solo ? '#000' : '#64748b',
                        cursor: 'pointer', fontSize: '10px', fontWeight: '900',
                    }}
                >S</button>
            </div>
        </div>
    );
};

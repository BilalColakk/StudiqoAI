import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Square, CheckCircle } from 'lucide-react';

export default function FocusOverlay({ 
  isOpen, 
  onClose, 
  courseName, 
  remainingTime,
  totalSeconds,
  remainingSeconds,
  isRunning, 
  onPause, 
  onResume, 
  onReset, 
  onComplete,
  isFinished 
}) {
  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const [pomodoroMode, setPomodoroMode] = useState(false);

  if (!isOpen) return null;

  // Dairesel progress hesaplama
  const SIZE = 280;
  const STROKE = 12;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const progress = totalSeconds > 0
    ? Math.max(0, Math.min(1, remainingSeconds / totalSeconds))
    : 1;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  // Renk: kalan süreye göre
  let defaultColor = isFinished
    ? '#22C55E'
    : progress > 0.5
    ? '#6C63FF'
    : progress > 0.2
    ? '#F59E0B'
    : '#EF4444';

  const elapsed = totalSeconds - remainingSeconds;
  const pomodoroCycle = elapsed % 1800;
  const isPomodoroBreak = pomodoroMode && pomodoroCycle >= 1500;
  
  const ringColor = isPomodoroBreak ? '#3B82F6' : defaultColor;
  let phaseText = "Odak Modu";
  if (isFinished) phaseText = "Tamamlandı";
  else if (pomodoroMode) phaseText = isPomodoroBreak ? "Pomodoro Mola (5dk)" : "Pomodoro Odak (25dk)";

  return (
    <AnimatePresence>
      <motion.div
        className="focus-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'var(--bg-base)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 30, right: 30,
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <X size={32} />
        </button>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{ color: isPomodoroBreak ? '#3B82F6' : 'var(--accent-1)', fontSize: 13, fontWeight: 700, marginBottom: 8, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            {phaseText}
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', marginBottom: 48, color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
            {courseName}
          </h1>
          
          <div style={{ marginBottom: 32 }}>
            <button 
              onClick={() => setPomodoroMode(!pomodoroMode)}
              style={{
                background: pomodoroMode ? 'rgba(108,99,255,0.15)' : 'transparent',
                border: `1px solid ${pomodoroMode ? 'var(--accent-1)' : 'var(--border)'}`,
                color: pomodoroMode ? 'var(--accent-1)' : 'var(--text-secondary)',
                padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              🍅 Pomodoro Modu: {pomodoroMode ? 'Açık' : 'Kapalı'}
            </button>
          </div>

          {/* Dairesel süre göstergesi */}
          <div style={{ position: 'relative', width: SIZE, height: SIZE, margin: '0 auto 56px' }}>
            <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
              {/* Arka halka */}
              <circle
                cx={SIZE / 2} cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="var(--bg-card)"
                strokeWidth={STROKE}
              />
              {/* İlerleme halkası */}
              <motion.circle
                cx={SIZE / 2} cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={ringColor}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                style={{ filter: `drop-shadow(0 0 8px ${ringColor}88)` }}
              />
            </svg>
            {/* Merkez zaman */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                fontSize: 'clamp(2.8rem, 8vw, 5rem)',
                fontWeight: 800,
                fontFamily: "'Space Grotesk', sans-serif",
                color: isFinished ? '#22C55E' : 'var(--text-primary)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}>
                {remainingTime}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                {isFinished ? '✅ Tamamlandı!' : (isPomodoroBreak && isRunning) ? 'Molanı yapıyorsun...' : isRunning ? 'devam ediyor' : 'duraklatıldı'}
              </div>
              {/* Yüzde */}
              <div style={{ fontSize: 11, color: ringColor, fontWeight: 700, marginTop: 4 }}>
                %{Math.round(progress * 100)} kaldı
              </div>
            </div>
          </div>

          {/* Kontrol butonları */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
            {!isFinished && isRunning && (
              <button className="focus-btn btn-secondary" onClick={onPause} title="Duraklat">
                <Pause size={32} />
              </button>
            )}

            {!isFinished && !isRunning && (
              <button className="focus-btn btn-primary" onClick={onResume} title="Devam Et">
                <Play size={32} />
              </button>
            )}

            {(isFinished || remainingTime === '00:00:00') && (
              <button className="focus-btn btn-success" onClick={onComplete} title="Tamamla">
                <CheckCircle size={32} />
              </button>
            )}

            <button className="focus-btn btn-danger" onClick={onReset} title="Sıfırla">
              <Square size={32} />
            </button>
          </div>
        </motion.div>

        <style>{`
          .focus-btn {
            width: 80px; height: 80px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            border: none; cursor: pointer; transition: all 0.2s;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          }
          .focus-btn:hover { transform: scale(1.1); }
          .focus-btn.btn-primary { background: var(--accent-1); color: #fff; }
          .focus-btn.btn-secondary { background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border); }
          .focus-btn.btn-success { background: var(--success); color: #fff; }
          .focus-btn.btn-danger { background: var(--danger); color: #fff; }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}

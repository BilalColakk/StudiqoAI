import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Square, CheckCircle } from 'lucide-react';

export default function FocusOverlay({ 
  isOpen, 
  onClose, 
  courseName, 
  remainingTime, 
  isRunning, 
  onPause, 
  onResume, 
  onReset, 
  onComplete,
  isFinished 
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="focus-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'var(--bg-base)',
          display: 'flex', flexDirection: 'column', 
          alignItems: 'center', justifyContent: 'center',
          padding: 20
        }}
      >
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', top: 30, right: 30, 
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer'
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
          <div style={{ color: 'var(--accent-1)', fontSize: 18, fontWeight: 600, marginBottom: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Odak Modu
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 8vw, 4rem)', marginBottom: 40, color: 'var(--text-primary)' }}>
            {courseName}
          </h1>

          <div style={{ 
            fontSize: 'clamp(5rem, 15vw, 10rem)', 
            fontWeight: 800, 
            fontFamily: "'Space Grotesk', sans-serif",
            color: isFinished ? 'var(--success)' : 'var(--text-primary)',
            lineHeight: 1,
            marginBottom: 60
          }}>
            {remainingTime}
          </div>

          <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
            {!isFinished && isRunning && (
              <button className="focus-btn btn-secondary" onClick={onPause}>
                <Pause size={32} />
              </button>
            )}

            {!isFinished && !isRunning && (
              <button className="focus-btn btn-primary" onClick={onResume}>
                <Play size={32} />
              </button>
            )}

            {(isFinished || remainingTime === "00:00:00") && (
              <button className="focus-btn btn-success" onClick={onComplete}>
                <CheckCircle size={32} />
              </button>
            )}

            <button className="focus-btn btn-danger" onClick={onReset}>
              <Square size={32} />
            </button>
          </div>
        </motion.div>

        <style>{`
          .focus-btn {
            width: 80px; height: 80px; border-radius: 50%;
            display: flex; alignItems: center; justifyContent: center;
            border: none; cursor: pointer; transition: all 0.2s;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          }
          .focus-btn:hover { transform: scale(1.1); }
          .btn-primary { background: var(--accent-1); color: #fff; }
          .btn-secondary { background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border); }
          .btn-success { background: var(--success); color: #fff; }
          .btn-danger { background: var(--danger); color: #fff; }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}

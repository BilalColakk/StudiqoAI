import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Trash2, Clock, Check, X, AlertCircle, Zap } from 'lucide-react';
import Navbar from '../components/Navbar';
import LoadingSkeleton from '../components/LoadingSkeleton';
import PageTransition from '../components/PageTransition';
import { getAvailability, setAvailability } from '../api/endpoints';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = ['00', '15', '30', '45'];

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function totalMinutes(windows) {
  return windows.reduce((acc, w) => acc + (timeToMinutes(w.end_time) - timeToMinutes(w.start_time)), 0);
}

function WindowCard({ win, index, onDelete }) {
  const diff = timeToMinutes(win.end_time) - timeToMinutes(win.start_time);
  const hours = Math.floor(diff / 60);
  const mins  = diff % 60;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.9, height: 0, marginBottom: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="glass-card"
      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}
    >
      {/* Index badge */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #6C63FF, #00D2FF)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 800, color: '#fff',
      }}>
        {index + 1}
      </div>

      {/* Visual bar */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Clock size={13} color="#6C63FF" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F4FF' }}>
            {win.start_time}
          </span>
          <span style={{ fontSize: 14, color: '#8892AA' }}>→</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F4FF' }}>
            {win.end_time}
          </span>
        </div>

        {/* Time bar visualization */}
        <div style={{ position: 'relative', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(diff / (24 * 60)) * 100}%` }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'absolute', left: `${(timeToMinutes(win.start_time) / (24 * 60)) * 100}%`,
              height: '100%', borderRadius: 8,
              background: 'linear-gradient(90deg, #6C63FF, #00D2FF)',
              boxShadow: '0 0 10px rgba(108,99,255,0.5)',
            }}
          />
        </div>

        <div style={{ fontSize: 12, color: '#8892AA', marginTop: 6 }}>
          {hours > 0 && `${hours} saat `}{mins > 0 && `${mins} dakika`}
        </div>
      </div>

      <motion.button
        className="btn btn-danger btn-sm"
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={() => onDelete(index)}
        style={{ padding: '6px', flexShrink: 0 }}
      >
        <Trash2 size={14} />
      </motion.button>
    </motion.div>
  );
}

export default function Availability() {
  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newWin,  setNewWin]  = useState({ start_time: '09:00', end_time: '12:00' });
  const [error,   setError]   = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAvailability();
      setWindows(res.data.windows || []);
    } catch { toast.error('Müsaitlik yüklenemedi'); }
    finally { setLoading(false); }
  };

  const validateAndAdd = () => {
    setError('');
    const s = timeToMinutes(newWin.start_time);
    const e = timeToMinutes(newWin.end_time);

    if (e <= s) { setError('Bitiş saati başlangıçtan büyük olmalı'); return; }
    if (e - s < 30) { setError('Minimum 30 dakika olmalı'); return; }

    // Overlap check
    for (const w of windows) {
      const ws = timeToMinutes(w.start_time);
      const we = timeToMinutes(w.end_time);
      if (s < we && e > ws) { setError('Bu pencere mevcut bir pencereyle çakışıyor'); return; }
    }

    setWindows(p => [...p, { ...newWin }].sort((a, b) =>
      timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
    ));
    setShowAdd(false);
  };

  const handleDelete = (index) => {
    setWindows(p => p.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (windows.length === 0) {
      toast.error('En az bir zaman penceresi ekleyin');
      return;
    }
    setSaving(true);
    try {
      await setAvailability({ windows });
      toast.success('Müsaitlik saatleri kaydedildi! ✅');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Kaydedilemedi');
    } finally { setSaving(false); }
  };

  const total = totalMinutes(windows);
  const totalH = Math.floor(total / 60);
  const totalM = total % 60;

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#0D1117', color: '#F0F4FF', border: '1px solid rgba(255,255,255,0.08)' }
      }} />
      <div className="glow-orb" style={{ width: 400, height: 400, background: '#00D2FF', bottom: -100, right: -100, opacity: 0.05 }} />

      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <PageTransition>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 className="page-title">Müsaitlik Saatlerim ⏰</h1>
                <p className="page-subtitle">AI planın bu saatlere göre çalışma bloklarını oluşturur</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <motion.button className="btn btn-secondary"
                  onClick={() => { setShowAdd(true); setError(''); }}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Plus size={16} /> Pencere Ekle
                </motion.button>
                <motion.button className="btn btn-primary"
                  onClick={handleSave} disabled={saving}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  {saving
                    ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    : <><Check size={16} /> Kaydet</>
                  }
                </motion.button>
              </div>
            </div>

            {/* Total hours summary */}
            {windows.length > 0 && (
              <motion.div className="glass-card"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6C63FF',
                }}>
                  <Zap size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#F0F4FF', fontFamily: "'Space Grotesk', sans-serif" }}>
                    {totalH > 0 && `${totalH} saat `}{totalM > 0 && `${totalM} dakika`}
                  </div>
                  <div style={{ fontSize: 13, color: '#8892AA' }}>
                    günlük toplam müsait süre · {windows.length} pencere
                  </div>
                </div>

                {/* 24h visual timeline */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ position: 'relative', height: 14, background: 'rgba(255,255,255,0.05)', borderRadius: 7, overflow: 'hidden' }}>
                    {windows.map((w, i) => {
                      const left  = (timeToMinutes(w.start_time) / (24 * 60)) * 100;
                      const width = ((timeToMinutes(w.end_time) - timeToMinutes(w.start_time)) / (24 * 60)) * 100;
                      return (
                        <motion.div key={i}
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: `${width}%`, opacity: 1 }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                          style={{
                            position: 'absolute', left: `${left}%`,
                            height: '100%', borderRadius: 7,
                            background: 'linear-gradient(90deg, #6C63FF, #00D2FF)',
                            boxShadow: '0 0 8px rgba(108,99,255,0.5)',
                          }}
                        />
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#4A5568', marginTop: 4 }}>
                    <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
                  </div>
                </div>
              </motion.div>
            )}

            {loading ? <LoadingSkeleton rows={3} height={90} /> : (
              <>
                {windows.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">⏰</div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F0F4FF' }}>Henüz müsaitlik saati eklenmedi</h3>
                    <p style={{ color: '#8892AA', fontSize: 14, maxWidth: 340, textAlign: 'center' }}>
                      Hangi saatlerde çalışabileceğini belirt. AI planın bu bilgiye göre hazırlanır.
                    </p>
                    <button className="btn btn-primary" onClick={() => { setShowAdd(true); setError(''); }}>
                      <Plus size={16} /> İlk Pencereyi Ekle
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <AnimatePresence mode="popLayout">
                      {windows.map((w, i) => (
                        <WindowCard key={`${w.start_time}-${w.end_time}`} win={w} index={i} onDelete={handleDelete} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}
          </PageTransition>
        </main>
      </div>

      {/* Add Window Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}
          >
            <motion.div className="modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F4FF' }}>Zaman Penceresi Ekle</h2>
                <button className="btn-icon btn" onClick={() => setShowAdd(false)}><X size={16} /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div className="input-group">
                  <label className="input-label">Başlangıç Saati</label>
                  <select className="input" value={newWin.start_time}
                    onChange={e => setNewWin(p => ({ ...p, start_time: e.target.value }))}>
                    {HOURS.flatMap(h => MINUTES.map(m =>
                      <option key={`${h}:${m}`} value={`${String(h).padStart(2,'0')}:${m}`}>
                        {String(h).padStart(2,'0')}:{m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Bitiş Saati</label>
                  <select className="input" value={newWin.end_time}
                    onChange={e => setNewWin(p => ({ ...p, end_time: e.target.value }))}>
                    {HOURS.flatMap(h => MINUTES.map(m =>
                      <option key={`${h}:${m}`} value={`${String(h).padStart(2,'0')}:${m}`}>
                        {String(h).padStart(2,'0')}:{m}
                      </option>
                    ))}
                    <option value="24:00">24:00</option>
                  </select>
                </div>
              </div>

              {/* Preview bar */}
              {newWin.start_time && newWin.end_time && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ position: 'relative', height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5 }}>
                    <div style={{
                      position: 'absolute',
                      left: `${(timeToMinutes(newWin.start_time) / (24 * 60)) * 100}%`,
                      width: `${Math.max(((timeToMinutes(newWin.end_time) - timeToMinutes(newWin.start_time)) / (24 * 60)) * 100, 0)}%`,
                      height: '100%', borderRadius: 5,
                      background: 'linear-gradient(90deg, #6C63FF, #00D2FF)',
                    }} />
                  </div>
                </div>
              )}

              {error && (
                <div style={{
                  display: 'flex', gap: 8, alignItems: 'center',
                  padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                  color: '#EF4444', fontSize: 13,
                }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>İptal</button>
                <motion.button className="btn btn-primary" style={{ flex: 1 }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={validateAndAdd}>
                  <Plus size={15} /> Ekle
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

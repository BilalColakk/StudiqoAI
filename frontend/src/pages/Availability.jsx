import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Trash2, Clock, Check, X, AlertCircle, Zap, Copy } from 'lucide-react';
import Navbar from '../components/Navbar';
import LoadingSkeleton from '../components/LoadingSkeleton';
import PageTransition from '../components/PageTransition';
import { getAvailability, setAvailability } from '../api/endpoints';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = ['00', '15', '30', '45'];
const DAYS = [
  { label: 'Pt', full: 'Pazartesi', value: 0 },
  { label: 'Sa', full: 'Salı', value: 1 },
  { label: 'Ça', full: 'Çarşamba', value: 2 },
  { label: 'Pe', full: 'Perşembe', value: 3 },
  { label: 'Cu', full: 'Cuma', value: 4 },
  { label: 'Ct', full: 'Cumartesi', value: 5 },
  { label: 'Pz', full: 'Pazar', value: 6 }
];

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
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
      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', marginBottom: 12 }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #6C63FF, #00D2FF)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 800, color: '#fff',
      }}>
        {index + 1}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Clock size={13} color="#6C63FF" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{win.start_time}</span>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>→</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{win.end_time}</span>
        </div>

        <div style={{ position: 'relative', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(diff / (24 * 60)) * 100}%` }}
            style={{
              position: 'absolute', left: `${(timeToMinutes(win.start_time) / (24 * 60)) * 100}%`,
              height: '100%', borderRadius: 8,
              background: 'linear-gradient(90deg, #6C63FF, #00D2FF)'
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
          {hours > 0 && `${hours} saat `}{mins > 0 && `${mins} dakika`}
        </div>
      </div>

      <motion.button className="btn btn-danger btn-sm"
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={() => onDelete(win)}
        style={{ padding: '6px', flexShrink: 0 }}
      >
        <Trash2 size={14} />
      </motion.button>
    </motion.div>
  );
}

export default function Availability() {
  const [windows, setWindows] = useState([]);
  const [originalWindows, setOriginalWindows] = useState([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newWin,  setNewWin]  = useState({ start_time: '09:00', end_time: '12:00' });
  const [error,   setError]   = useState('');

  useEffect(() => { load(); }, []);

  const sortWindows = (arr) => arr.sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
    return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAvailability();
      const loaded = sortWindows(res.data.windows || []);
      setWindows(loaded);
      setOriginalWindows(loaded);
    } catch { toast.error('Müsaitlik yüklenemedi'); }
    finally { setLoading(false); }
  };

  const isDirty = JSON.stringify(windows) !== JSON.stringify(originalWindows);
  const dayWindows = windows.filter(w => w.day_of_week === selectedDay);

  const validateAndAdd = () => {
    setError('');
    const s = timeToMinutes(newWin.start_time);
    const e = timeToMinutes(newWin.end_time);

    if (e <= s) { setError('Bitiş saati başlangıçtan büyük olmalı'); return; }
    if (e - s < 30) { setError('Minimum 30 dakika olmalı'); return; }

    for (const w of dayWindows) {
      if (s < timeToMinutes(w.end_time) && e > timeToMinutes(w.start_time)) {
        setError('Bu pencere mevcut bir pencereyle çakışıyor'); return;
      }
    }

    setWindows(p => sortWindows([...p, { day_of_week: selectedDay, ...newWin }]));
    setShowAdd(false);
  };

  const handleDelete = (winToDelete) => {
    setWindows(p => p.filter(w => w !== winToDelete));
  };

  const handleCopyDay = () => {
    if (dayWindows.length === 0) return;
    const newWindows = windows.filter(w => w.day_of_week === selectedDay);
    for (let i = 0; i < 7; i++) {
      if (i === selectedDay) continue;
      dayWindows.forEach(dw => newWindows.push({ ...dw, day_of_week: i }));
    }
    setWindows(sortWindows(newWindows));
    toast.success(`${DAYS[selectedDay].full} programı tüm günlere kopyalandı!`);
  };

  const handleSave = async () => {
    if (windows.length === 0) {
      toast.error('En az bir zaman penceresi ekleyin');
      return;
    }
    setSaving(true);
    try {
      await setAvailability({ windows });
      setOriginalWindows(windows);
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
      <Toaster position="top-right" toastOptions={{ style: { background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' } }} />
      <div className="glow-orb" style={{ width: 400, height: 400, background: '#00D2FF', bottom: -100, right: -100, opacity: 0.05 }} />

      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <PageTransition>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 className="page-title">Müsaitlik Saatlerim ⏰</h1>
                <p className="page-subtitle">AI planın gün bazlı bu saatlere göre oluşturulur</p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {isDirty && <span style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>Kaydedilmemiş değişiklikler var</span>}
                <motion.button className="btn btn-primary" onClick={handleSave} disabled={saving || !isDirty}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  {saving ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : <><Check size={16} /> Kaydet</>}
                </motion.button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 20 }}>
              {DAYS.map(day => {
                const dayCount = windows.filter(w => w.day_of_week === day.value).length;
                return (
                  <button key={day.value}
                    onClick={() => setSelectedDay(day.value)}
                    style={{
                      flexShrink: 0, padding: '10px 16px', borderRadius: 12,
                      background: selectedDay === day.value ? 'var(--accent-1)' : 'var(--bg-surface)',
                      color: selectedDay === day.value ? '#fff' : 'var(--text-secondary)',
                      border: `1px solid ${selectedDay === day.value ? 'transparent' : 'var(--border)'}`,
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.2s',
                    }}>
                    <span style={{ fontWeight: 700 }}>{day.full}</span>
                    <span style={{ fontSize: 11, opacity: 0.8 }}>{dayCount} pencere</span>
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 700 }}>{DAYS[selectedDay].full}</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {dayWindows.length > 0 && (
                   <button className="btn btn-secondary btn-sm" onClick={handleCopyDay} title="Bu günün programını tüm haftaya kopyala">
                     <Copy size={14} /> Tüm Günlere Kopyala
                   </button>
                )}
                <button className="btn btn-secondary btn-sm" onClick={() => { setShowAdd(true); setError(''); }}>
                  <Plus size={14} /> Pencere Ekle
                </button>
              </div>
            </div>

            {loading ? <LoadingSkeleton rows={3} height={90} /> : (
              <>
                {dayWindows.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">⏰</div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Bu güne müsaitlik eklenmedi</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 340, textAlign: 'center' }}>
                      Eğer boş bırakırsan planlayıcı bu güne çalışma saati atamayacaktır.
                    </p>
                    <button className="btn btn-primary" onClick={() => { setShowAdd(true); setError(''); }}>
                      <Plus size={16} /> İlk Pencereyi Ekle
                    </button>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {dayWindows.map((w, i) => (
                      <WindowCard key={`${w.day_of_week}-${w.start_time}-${w.end_time}`} win={w} index={i} onDelete={handleDelete} />
                    ))}
                  </AnimatePresence>
                )}
              </>
            )}
            
            {/* Haftalık özet */}
            {windows.length > 0 && (
              <div style={{ marginTop: 40, padding: 20, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Haftalık Toplam Müsaitlik</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-1)' }}>
                  {totalH} saat {totalM > 0 ? `${totalM} dakika` : ''}
                </div>
              </div>
            )}
          </PageTransition>
        </main>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}>
            <motion.div className="modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Zaman Penceresi Ekle ({DAYS[selectedDay].full})</h2>
                <button className="btn-icon btn" onClick={() => setShowAdd(false)}><X size={16} /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div className="input-group">
                  <label className="input-label">Başlangıç Saati</label>
                  <select className="input" value={newWin.start_time} onChange={e => setNewWin(p => ({ ...p, start_time: e.target.value }))}>
                    {HOURS.flatMap(h => MINUTES.map(m => <option key={`${h}:${m}`} value={`${String(h).padStart(2,'0')}:${m}`}>{String(h).padStart(2,'0')}:{m}</option>))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Bitiş Saati</label>
                  <select className="input" value={newWin.end_time} onChange={e => setNewWin(p => ({ ...p, end_time: e.target.value }))}>
                    {HOURS.flatMap(h => MINUTES.map(m => <option key={`${h}:${m}`} value={`${String(h).padStart(2,'0')}:${m}`}>{String(h).padStart(2,'0')}:{m}</option>))}
                    <option value="24:00">24:00</option>
                  </select>
                </div>
              </div>

              {error && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: 13 }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>İptal</button>
                <motion.button className="btn btn-primary" style={{ flex: 1 }} onClick={validateAndAdd}><Plus size={15} /> Ekle</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

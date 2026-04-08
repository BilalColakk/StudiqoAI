import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { format, differenceInDays, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Plus, Trash2, Edit3, CalendarCheck, X, Check, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import LoadingSkeleton from '../components/LoadingSkeleton';
import PageTransition from '../components/PageTransition';
import { getCourses, getExams, createExam, updateExam, deleteExam } from '../api/endpoints';

const TYPE_META = {
  quiz:    { label: 'Quiz',    color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  badgeClass: 'badge-blue'   },
  midterm: { label: 'Vize',   color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  badgeClass: 'badge-yellow' },
  final:   { label: 'Final',  color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   badgeClass: 'badge-red'    },
  other:   { label: 'Diğer', color: '#8892AA', bg: 'rgba(136,146,170,0.12)', badgeClass: 'badge-gray'   },
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return differenceInDays(parseISO(dateStr), new Date());
}

function CountdownChip({ days }) {
  if (days === null) return null;
  const color = days === 0 ? '#EF4444' : days <= 3 ? '#EF4444' : days <= 7 ? '#F59E0B' : '#22C55E';
  const label = days === 0 ? 'BUGÜN!' : days === 1 ? 'Yarın' : `${days} gün`;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, color,
      background: `${color}18`, border: `1px solid ${color}33`,
      borderRadius: 20, padding: '2px 9px',
      ...(days <= 3 && { animation: 'pulse 2s infinite' }),
    }}>
      ⏱ {label}
    </span>
  );
}

export default function Exams() {
  const [exams,    setExams]    = useState([]);
  const [courses,  setCourses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editExam, setEditExam] = useState(null);
  const [form,     setForm]     = useState({ course_id: '', exam_type: 'midterm', exam_date: '' });
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [eRes, cRes] = await Promise.all([getExams(), getCourses()]);
      setExams(eRes.data.exams || []);
      setCourses(cRes.data.courses || []);
    } catch { toast.error('Veriler yüklenemedi'); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditExam(null);
    setForm({ course_id: courses[0]?.id || '', exam_type: 'midterm', exam_date: '' });
    setShowForm(true);
  };

  const openEdit = (exam) => {
    setEditExam(exam);
    setForm({ course_id: exam.course_id, exam_type: exam.exam_type, exam_date: exam.exam_date || '' });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        course_id: Number(form.course_id),
        exam_type: form.exam_type,
        exam_date: form.exam_date || null,
      };
      if (editExam) {
        await updateExam(editExam.exam_id, payload);
        toast.success('Sınav güncellendi!');
      } else {
        await createExam(payload);
        toast.success('Sınav eklendi!');
      }
      setShowForm(false);
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'İşlem başarısız');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu sınavı silmek istiyor musun?')) return;
    try {
      await deleteExam(id);
      toast.success('Sınav silindi');
      setExams(p => p.filter(e => e.exam_id !== id));
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Silinemedi');
    }
  };

  // Group by type
  const upcoming = exams.filter(e => e.exam_date && daysUntil(e.exam_date) >= 0)
    .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));
  const noDate   = exams.filter(e => !e.exam_date);
  const sorted   = [...upcoming, ...noDate];

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
      }} />
      <div className="glow-orb" style={{ width: 400, height: 400, background: '#F59E0B', top: -150, right: 0, opacity: 0.05 }} />

      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <PageTransition>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h1 className="page-title">Sınavlarım 🎯</h1>
                <p className="page-subtitle">{upcoming.length} yaklaşan sınav · Tarihe göre sıralı</p>
              </div>
              <motion.button className="btn btn-primary"
                onClick={openAdd} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Plus size={16} /> Sınav Ekle
              </motion.button>
            </div>

            {loading ? <LoadingSkeleton rows={4} height={80} /> : (
              sorted.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Henüz sınav eklenmedi</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Sınavlarını ekle, AI planın buna göre hazırlansın</p>
                  <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Sınav Ekle</button>
                </div>
              ) : (
                <div style={{ position: 'relative', paddingLeft: 40 }}>
                  {/* Timeline line */}
                  <div className="timeline-line" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <AnimatePresence>
                      {sorted.map((exam, i) => {
                        const meta  = TYPE_META[exam.exam_type] || TYPE_META.other;
                        const days  = exam.exam_date ? daysUntil(exam.exam_date) : null;
                        const fmtDate = exam.exam_date
                          ? format(parseISO(exam.exam_date), 'dd MMMM yyyy', { locale: tr })
                          : 'Tarih belirsiz';

                        return (
                          <motion.div key={exam.exam_id}
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                            transition={{ delay: i * 0.06 }}
                            style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}
                          >
                            {/* Timeline dot */}
                            <div className="timeline-dot" style={{
                              background: meta.color,
                              borderColor: meta.color,
                              boxShadow: `0 0 10px ${meta.color}66`,
                              marginTop: 16, marginLeft: -25,
                            }} />

                            {/* Card */}
                            <motion.div
                              className="glass-card"
                              whileHover={{ x: 4 }}
                              style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}
                            >
                              {/* Type icon block */}
                              <div style={{
                                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                                background: meta.bg, border: `1px solid ${meta.color}33`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: meta.color,
                              }}>
                                <CalendarCheck size={20} />
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                  <span className={`badge ${meta.badgeClass}`} style={{ fontSize: 11 }}>
                                    {meta.label}
                                  </span>
                                  {days !== null && <CountdownChip days={days} />}
                                </div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                                  {exam.course_name}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 12 }}>
                                  <Clock size={12} /> {fmtDate}
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                <button className="btn-icon btn" onClick={() => openEdit(exam)} title="Düzenle">
                                  <Edit3 size={13} />
                                </button>
                                <button className="btn-icon btn" onClick={() => handleDelete(exam.exam_id)}
                                  title="Sil" style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </motion.div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )
            )}
          </PageTransition>
        </main>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div className="modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {editExam ? 'Sınavı Düzenle' : 'Yeni Sınav Ekle'}
                </h2>
                <button className="btn-icon btn" onClick={() => setShowForm(false)}><X size={16} /></button>
              </div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {!editExam && (
                  <div className="input-group">
                    <label className="input-label">Ders</label>
                    <select className="input" value={form.course_id}
                      onChange={e => setForm(p => ({ ...p, course_id: e.target.value }))} required>
                      <option value="">Ders seçin...</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.course_name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="input-group">
                  <label className="input-label">Sınav Tipi</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {Object.entries(TYPE_META).map(([key, meta]) => (
                      <button key={key} type="button"
                        onClick={() => setForm(p => ({ ...p, exam_type: key }))}
                        style={{
                          padding: '10px 4px', borderRadius: 10, border: `1px solid`,
                          borderColor: form.exam_type === key ? meta.color : 'rgba(255,255,255,0.08)',
                          background: form.exam_type === key ? meta.bg : 'transparent',
                          color: form.exam_type === key ? meta.color : 'var(--text-secondary)',
                          cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          fontFamily: "'Inter', sans-serif", transition: 'all 0.2s',
                        }}>
                        {meta.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Sınav Tarihi (opsiyonel)</label>
                  <input className="input" type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={form.exam_date}
                    onChange={e => setForm(p => ({ ...p, exam_date: e.target.value }))} />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>
                    İptal
                  </button>
                  <motion.button type="submit" className="btn btn-primary" style={{ flex: 1 }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={saving}>
                    {saving
                      ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      : <><Check size={15} /> {editExam ? 'Güncelle' : 'Ekle'}</>
                    }
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.6; } }
      `}</style>
    </>
  );
}
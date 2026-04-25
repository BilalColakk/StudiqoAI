import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Trash2, Edit3, BookOpen, Flame, Award, X, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import LoadingSkeleton from '../components/LoadingSkeleton';
import PageTransition from '../components/PageTransition';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../api/endpoints';
import { useTranslation } from '../i18n';

const DIFF_COLORS = ['#22C55E','#22C55E','#84CC16','#84CC16','#F59E0B','#F59E0B','#EF4444','#EF4444','#DC2626','#DC2626'];

function DifficultyBar({ value }) {
  return (
    <div className="difficulty-bar">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="difficulty-segment"
          style={{ background: i < value ? DIFF_COLORS[value - 1] : undefined }} />
      ))}
    </div>
  );
}

function CourseCard({ course, onDelete, onEdit }) {
  const [hovered, setHovered] = useState(false);
  const diffColor = DIFF_COLORS[course.difficulty - 1];

  return (
    <motion.div
      className="glass-card"
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Accent top line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${diffColor}, transparent)`,
        borderRadius: '14px 14px 0 0',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingTop: 4 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6C63FF',
        }}>
          <BookOpen size={18} />
        </div>

        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              style={{ display: 'flex', gap: 6 }}
            >
              <button className="btn-icon btn" onClick={() => onEdit(course)} title="Düzenle">
                <Edit3 size={13} />
              </button>
              <button className="btn-icon btn" onClick={() => onDelete(course.id)}
                title="Sil" style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }}>
                <Trash2 size={13} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.3 }}>
        {course.course_name}
      </h3>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <span className="badge badge-purple" style={{ fontSize: 11 }}>
          <Award size={10} /> {course.credit} kredi
        </span>
        <span className="badge" style={{
          fontSize: 11, background: `${diffColor}22`, color: diffColor,
          border: `1px solid ${diffColor}44`,
        }}>
          <Flame size={10} /> Zorluk {course.difficulty}
        </span>
      </div>

      <DifficultyBar value={course.difficulty} />
    </motion.div>
  );
}

export default function Courses() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [form, setForm] = useState({ course_name: '', difficulty: 5, credit: 3 });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getCourses();
      setCourses(res.data.courses || []);
    } catch { toast.error(t('TOAST_COURSE_ERR')); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditCourse(null);
    setForm({ course_name: '', difficulty: 5, credit: 3 });
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditCourse(c);
    setForm({ course_name: c.course_name, difficulty: c.difficulty, credit: c.credit });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editCourse) {
        await updateCourse(editCourse.id, {
          difficulty: form.difficulty,
          course_name: form.course_name,
          credit: form.credit,
        });
        toast.success(t('TOAST_COURSE_UPD'));
      } else {
        await createCourse(form);
        toast.success(t('TOAST_COURSE_ADD'));
      }
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.detail || t('ERROR_GENERIC'));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('CONFIRM_DEL_COURSE'))) return;
    try {
      await deleteCourse(id);
      toast.success(t('TOAST_COURSE_DEL'));
      setCourses(p => p.filter(c => c.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.detail || t('ERROR_DELETE'));
    }
  };

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
      }} />

      <div className="glow-orb" style={{ width: 400, height: 400, background: '#6C63FF', top: -150, right: 0, opacity: 0.07 }} />

      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <PageTransition>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h1 className="page-title">{t('COURSES_TITLE')}</h1>
                <p className="page-subtitle">{courses.length} {t('COURSES_SUB')}</p>
              </div>
              <motion.button
                className="btn btn-primary"
                onClick={openAdd}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              >
                <Plus size={16} /> {t('BTN_ADD_COURSE')}
              </motion.button>
            </div>

            {loading ? <LoadingSkeleton rows={3} height={160} /> : (
              courses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📚</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{t('NO_COURSES')}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t('NO_COURSES_SUB')}</p>
                  <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> {t('BTN_FIRST_COURSE')}</button>
                </div>
              ) : (
                <motion.div className="grid-3" layout>
                  <AnimatePresence>
                    {courses.map(c => (
                      <CourseCard key={c.id} course={c} onDelete={handleDelete} onEdit={openEdit} />
                    ))}
                  </AnimatePresence>
                </motion.div>
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
                  {editCourse ? t('MODAL_EDIT_COURSE') : t('MODAL_ADD_COURSE')}
                </h2>
                <button className="btn-icon btn" onClick={() => setShowForm(false)}><X size={16} /></button>
              </div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="input-group">
                  <label className="input-label">{t('COURSE_NAME')}</label>
                  <input className="input" placeholder={t('COURSE_NAME_PH')}
                    value={form.course_name}
                    onChange={e => setForm(p => ({ ...p, course_name: e.target.value }))} required />
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t('DIFFICULTY')}</span>
                    <span style={{ color: DIFF_COLORS[form.difficulty - 1], fontWeight: 700 }}>{form.difficulty} / 10</span>
                  </label>
                  <input type="range" className="slider" min={1} max={10}
                    value={form.difficulty}
                    onChange={e => setForm(p => ({ ...p, difficulty: Number(e.target.value) }))} />
                  <div className="mt-8"><DifficultyBar value={form.difficulty} /></div>
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t('CREDIT')}</span>
                    <span style={{ color: '#6C63FF', fontWeight: 700 }}>{form.credit}</span>
                  </label>
                  <input type="range" className="slider" min={1} max={10}
                    value={form.credit}
                    onChange={e => setForm(p => ({ ...p, credit: Number(e.target.value) }))} />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>
                    {t('BTN_CANCEL')}
                  </button>
                  <motion.button type="submit" className="btn btn-primary" style={{ flex: 1 }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={saving}>
                    {saving
                      ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      : <><Check size={15} /> {editCourse ? t('BTN_UPDATE') : t('BTN_ADD')}</>
                    }
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
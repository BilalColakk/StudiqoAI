import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Clock, Zap, ArrowRight, Check } from 'lucide-react';
import { createCourse, setAvailability, generatePlan } from '../api/endpoints';
import toast from 'react-hot-toast';

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [course, setCourse] = useState({ course_name: '', difficulty: 3, credit: 3 });
  const [avail, setAvail] = useState({ start_time: '09:00', end_time: '12:00' });
  const [loading, setLoading] = useState(false);

  const nextStep = () => setStep(p => p + 1);
  const prevStep = () => setStep(p => p - 1);

  const handleCreateCourse = async () => {
    if (!course.course_name) return toast.error('Ders adı gerekli!');
    setLoading(true);
    try {
      await createCourse(course);
      toast.success('Ders eklendi!');
      nextStep();
    } catch {
      toast.error('Ders eklenemedi');
    } finally { setLoading(false); }
  };

  const handleSetAvail = async () => {
    setLoading(true);
    try {
      // Create availability for all weekdays (Mon-Fri)
      const windows = [0, 1, 2, 3, 4].map(day => ({
        day_of_week: day,
        start_time: avail.start_time,
        end_time: avail.end_time
      }));
      await setAvailability({ windows });
      toast.success('Müsaitlik ayarlandı!');
      nextStep();
    } catch {
      toast.error('Müsaitlik ayarlanamadı');
    } finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await generatePlan({ preferred_block_hours: 2 });
      toast.success('Plan oluşturuldu!');
      onComplete(); // Triggers Dashboard to reload
    } catch {
      toast.error('Plan oluşturulamadı');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto 0' }}>
      <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 32 }}>
        
        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: step >= i ? 'var(--accent-1)' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ color: 'var(--accent-1)', marginBottom: 16 }}><BookOpen size={48} /></div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>İlk Dersini Ekle</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Sistemine ilk dersini ekleyerek başlayalım. Daha sonra başka dersler de ekleyebilirsin.</p>
              
              <div className="input-group">
                <label className="input-label">Dersin Adı</label>
                <input className="input" placeholder="Örn: Matematik 101" autoFocus
                  value={course.course_name} onChange={e => setCourse(p => ({ ...p, course_name: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Zorluk (1-5)</label>
                  <input type="number" min="1" max="5" className="input" 
                    value={course.difficulty} onChange={e => setCourse(p => ({ ...p, difficulty: Number(e.target.value) }))} />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Kredi</label>
                  <input type="number" min="1" className="input" 
                    value={course.credit} onChange={e => setCourse(p => ({ ...p, credit: Number(e.target.value) }))} />
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={handleCreateCourse} disabled={loading}>
                Devam Et <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ color: '#00D2FF', marginBottom: 16 }}><Clock size={48} /></div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Çalışma Saatlerin</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Hafta içi genel olarak hangi saatler arası ders çalışabilirsin? Bu, AI programı ayarlarken kullanılacak.</p>
              
              <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Başlangıç Saati</label>
                  <input type="time" className="input" value={avail.start_time} onChange={e => setAvail(p => ({ ...p, start_time: e.target.value }))} />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Bitiş Saati</label>
                  <input type="time" className="input" value={avail.end_time} onChange={e => setAvail(p => ({ ...p, end_time: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" onClick={prevStep} disabled={loading}>Geri</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSetAvail} disabled={loading}>
                  Devam Et <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ color: '#F59E0B', marginBottom: 16 }}><Zap size={48} /></div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Her Şey Hazır!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                Bilgilerini aldık. Şimdi AI ile senin için optimize edilmiş ilk haftalık çalışma programını oluşturma zamanı.
              </p>
              
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', height: 60, fontSize: 18, background: 'linear-gradient(135deg, #6C63FF, #00D2FF)', border: 'none' }} 
                onClick={handleGenerate} 
                disabled={loading}
              >
                {loading ? 'Oluşturuluyor...' : 'İlk Programımı Oluştur 🚀'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

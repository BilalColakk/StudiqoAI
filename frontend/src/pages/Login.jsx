import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Brain, Sparkles, ArrowRight } from 'lucide-react';
import { loginUser } from '../api/endpoints';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser(form);
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('userEmail', form.email);
      toast.success('Başarıyla giriş yapıldı!');
      setTimeout(() => navigate('/dashboard'), 600);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Giriş başarısız. Bilgilerinizi kontrol ediniz.';
      toast.error(msg, { duration: 4000 });
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
      }} />

      <div className="auth-layout">
        <div className="auth-left">
          <div className="auth-blob" style={{ width: 400, height: 400, background: 'var(--accent-1)', top: '-100px', left: '-100px', opacity: 0.15 }} />
          <div className="auth-blob" style={{ width: 300, height: 300, background: 'var(--accent-2)', bottom: '-50px', right: '-50px', animationDelay: '3s', opacity: 0.15 }} />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}
          >
            <div style={{
              width: 72, height: 72, background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)', borderRadius: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              border: '1px solid rgba(255,255,255,0.3)',
            }}>
              <Brain size={36} color="#fff" />
            </div>
            <h1 style={{ color: '#fff', fontSize: 36, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, marginBottom: 16 }}>
              Studiqo
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, maxWidth: 320, lineHeight: 1.7, margin: '0 auto' }}>
              Yapay zeka destekli çalışma planlarıyla sınav başarısını zirveye taşı.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 40, alignItems: 'center' }}>
              {['Akıllı öncelik sıralaması', 'Haftalık otomatik planlama', 'Adaptif plan güncelleme'].map((f, i) => (
                <motion.div key={f}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
                    padding: '10px 16px', borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.2)',
                    width: 'fit-content'
                  }}
                >
                  <Sparkles size={14} color="#fff" />
                  <span style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{f}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="auth-right">
          <motion.div
            className="auth-card"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <div style={{ marginBottom: 36 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                Tekrar hoş geldin 👋
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Hesabına giriş yaparak planlarına ulaş
              </p>
            </div>

            <motion.form
              onSubmit={handleSubmit}
              animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
              transition={{ duration: 0.4 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <div className="input-group">
                <label className="input-label">E-posta</label>
                <div className="input-wrapper">
                  <Mail size={16} className="input-icon" />
                  <input
                    className="input"
                    type="email"
                    placeholder="ornek@email.com"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>Şifre</label>
                  <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--accent-1)', textDecoration: 'none' }}>
                    Şifremi unuttum
                  </Link>
                </div>
                <div className="input-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input
                    className="input"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    required
                  />
                  <button type="button" className="input-action" onClick={() => setShowPw(p => !p)}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 4, height: 48 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
              >
                {loading ? (
                  <div style={{
                    width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid #fff', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                ) : (
                  <> Giriş Yap <ArrowRight size={16} /> </>
                )}
              </motion.button>
            </motion.form>

            <div className="divider-text" style={{ marginTop: 28 }}>veya</div>

            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
              Hesabın yok mu?{' '}
              <Link to="/register" style={{ color: 'var(--accent-1)', fontWeight: 600, textDecoration: 'none' }}>
                Kayıt ol
              </Link>
            </p>
          </motion.div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
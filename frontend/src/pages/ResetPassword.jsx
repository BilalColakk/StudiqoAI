import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { resetPassword } from '../api/endpoints';

export default function ResetPassword() {
  const { token }             = useParams();
  const navigate              = useNavigate();
  const [form, setForm]       = useState({ password: '', confirm: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Şifreler eşleşmiyor!');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalı!');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ token, new_password: form.password });
      toast.success('Şifreniz başarıyla yenilendi! Giriş yapabilirsiniz.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Şifre sıfırlama başarısız. Linkin süresi dolmuş olabilir.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
      }} />

      <div className="auth-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 450, margin: '0 auto' }}
        >
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              Yeni Şifre Belirle 🗝️
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Lütfen hesabınız için yeni bir şifre girin.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="input-group">
              <label className="input-label">Yeni Şifre</label>
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

            <div className="input-group">
              <label className="input-label">Yeni Şifre (Tekrar)</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                  required
                />
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
                <> Şifreyi Kaydet <ArrowRight size={16} /> </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

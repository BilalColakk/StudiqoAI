import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { forgotPassword } from '../api/endpoints';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSent(true);
      toast.success('Şifre sıfırlama linki e-posta adresine gönderildi (Terminali kontrol edin).', { duration: 5000 });
    } catch (err) {
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
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
              Şifremi Unuttum 🔒
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Kayıtlı e-posta adresini gir, sana sıfırlama linki gönderelim.
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="input-group">
                <label className="input-label">E-posta</label>
                <div className="input-wrapper">
                  <Mail size={16} className="input-icon" />
                  <input
                    className="input"
                    type="email"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
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
                  <> Sıfırlama Linki Gönder <ArrowRight size={16} /> </>
                )}
              </motion.button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 64, height: 64, background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Mail size={32} color="#22C55E" />
              </div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 12 }}>E-Posta Gönderildi</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                <strong>{email}</strong> adresine şifre sıfırlama talimatlarını içeren bir mail gönderdik (Terminalde).
              </p>
            </div>
          )}

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Giriş sayfasına dön
            </Link>
          </div>
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

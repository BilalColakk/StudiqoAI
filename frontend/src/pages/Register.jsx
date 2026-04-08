import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, UserPlus, ArrowRight, User, Phone } from 'lucide-react';
import { registerUser } from '../api/endpoints';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    first_name: '', 
    last_name: '', 
    phone_number: '', 
    email: '', 
    password: '', 
    confirm: '' 
  });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Strict Email Regex
    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

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
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number,
        email: form.email,
        password: form.password
      };
      await registerUser(payload);
      toast.success('Hesap oluşturuldu! Lütfen aktivasyon mailini (terminalde) kontrol et.', { duration: 5000 });
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Kayıt başarısız, lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const strength = form.password.length === 0 ? 0
    : form.password.length < 6 ? 1
    : form.password.length < 10 ? 2 : 3;

  const strengthColors = ['#EF4444', '#F59E0B', '#22C55E'];
  const strengthLabels = ['Zayıf', 'Orta', 'Güçlü'];

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#0D1117', color: '#F0F4FF', border: '1px solid rgba(255,255,255,0.08)' }
      }} />

      <div className="auth-layout">
        {/* Left */}
        <div className="auth-left" style={{ background: 'linear-gradient(135deg, #00D2FF 0%, #6C63FF 100%)' }}>
          <div className="auth-blob" style={{ width: 350, height: 350, background: '#6C63FF', top: '-80px', left: '-80px' }} />
          <div className="auth-blob" style={{ width: 250, height: 250, background: '#fff', bottom: '-60px', right: '-40px', animationDelay: '4s' }} />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}
          >
            <div style={{
              width: 72, height: 72, background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)', borderRadius: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', border: '1px solid rgba(255,255,255,0.3)',
            }}>
              <UserPlus size={36} color="#fff" />
            </div>
            <h1 style={{ color: '#fff', fontSize: 32, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, marginBottom: 12 }}>
              Yolculuğuna başla
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, maxWidth: 300, lineHeight: 1.7, margin: '0 auto' }}>
              Ücretsiz hesap oluştur ve yapay zeka destekli kişisel çalışma planına sahip ol.
            </p>
          </motion.div>
        </div>

        {/* Right */}
        <div className="auth-right">
          <motion.div
            className="auth-card auth-card-scroll"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: '#F0F4FF', marginBottom: 8 }}>
                Hesap oluştur ✨
              </h2>
              <p style={{ color: '#8892AA', fontSize: 14 }}>
                Dakikalar içinde başlamaya hazır ol
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Name & Surname Row */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div className="input-group" style={{ flex: 1, minWidth: 140 }}>
                  <label className="input-label">Ad</label>
                  <div className="input-wrapper">
                    <User size={16} className="input-icon" />
                    <input className="input" type="text" placeholder="Adınız"
                      value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} required />
                  </div>
                </div>
                <div className="input-group" style={{ flex: 1, minWidth: 140 }}>
                  <label className="input-label">Soyad</label>
                  <div className="input-wrapper">
                    <User size={16} className="input-icon" />
                    <input className="input" type="text" placeholder="Soyadınız"
                      value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} required />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">E-posta</label>
                <div className="input-wrapper">
                  <Mail size={16} className="input-icon" />
                  <input className="input" type="email" placeholder="ornek@email.com"
                    value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Telefon Numarası (Opsiyonel)</label>
                <div className="input-wrapper">
                  <Phone size={16} className="input-icon" />
                  <input className="input" type="tel" placeholder="0555 555 5555"
                    value={form.phone_number} onChange={e => setForm(p => ({ ...p, phone_number: e.target.value }))} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Şifre</label>
                <div className="input-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input className="input" type={showPw ? 'text' : 'password'} placeholder="••••••••"
                    value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                  <button type="button" className="input-action" onClick={() => setShowPw(p => !p)}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1,2,3].map(l => (
                        <div key={l} style={{
                          flex: 1, height: 4, borderRadius: 4,
                          background: strength >= l ? strengthColors[strength - 1] : 'rgba(255,255,255,0.08)',
                          transition: 'all 0.3s',
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11, color: strengthColors[strength - 1] }}>
                      {strength > 0 ? strengthLabels[strength - 1] : ''}
                    </span>
                  </div>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">Şifre Tekrar</label>
                <div className="input-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input className="input" type="password" placeholder="••••••••"
                    value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} required />
                </div>
                {form.confirm && form.password !== form.confirm && (
                  <span style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>Şifreler eşleşmiyor</span>
                )}
              </div>

              <motion.button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 12, height: 48 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
              >
                {loading
                  ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  : <> Kayıt Ol <ArrowRight size={16} /> </>
                }
              </motion.button>
            </form>

            <div className="divider-text" style={{ marginTop: 24 }}>Zaten hesabın var mı?</div>
            <p style={{ textAlign: 'center' }}>
              <Link to="/login" style={{ color: '#6C63FF', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
                Giriş yap →
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        /* Scrollbar styles for the right auth card to avoid too tall popup */
        .auth-card-scroll::-webkit-scrollbar { width: 6px; }
        .auth-card-scroll::-webkit-scrollbar-track { background: transparent; }
        .auth-card-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </>
  );
}
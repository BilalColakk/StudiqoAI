import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { verifyEmail } from '../api/endpoints';

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const performVerification = async () => {
      try {
        const res = await verifyEmail(token);
        setStatus('success');
        setMessage(res.data.message || 'Hesabınız başarıyla doğrulandı!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.detail || 'Doğrulama başarısız. Link geçersiz veya süresi dolmuş olabilir.');
      }
    };

    if (token) {
      performVerification();
    } else {
      setStatus('error');
      setMessage('Doğrulama tokeni bulunamadı.');
    }
  }, [token]);

  return (
    <div className="auth-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ width: '100%', maxWidth: 450, textAlign: 'center', padding: '40px 32px' }}
      >
        {status === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <Loader2 size={48} className="spin" color="#6C63FF" />
            <h2 style={{ color: '#F0F4FF' }}>Hesabınız Doğrulanıyor...</h2>
            <p style={{ color: '#8892AA' }}>Lütfen bekleyin, işleminiz tamamlanıyor.</p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 64, height: 64, background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={40} color="#22C55E" />
            </div>
            <h2 style={{ color: '#F0F4FF' }}>Harika! ✨</h2>
            <p style={{ color: '#8892AA' }}>{message}</p>
            <motion.button
              onClick={() => navigate('/login')}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 12 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Giriş Yap <ArrowRight size={18} />
            </motion.button>
          </div>
        )}

        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 64, height: 64, background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={40} color="#EF4444" />
            </div>
            <h2 style={{ color: '#F0F4FF' }}>Bir Sorun Oluştu</h2>
            <p style={{ color: '#8892AA' }}>{message}</p>
            <Link to="/register" style={{ color: '#6C63FF', fontWeight: 600, textDecoration: 'none', marginTop: 10 }}>
              Tekrar kayıt olmayı dene →
            </Link>
          </div>
        )}
      </motion.div>
      <style>{`
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

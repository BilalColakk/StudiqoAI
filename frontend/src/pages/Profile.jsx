import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { User, Mail, Phone, Lock, Save, Loader2, ShieldCheck, Zap, Award } from 'lucide-react';
import { getMe, updateMe, getProductivityStats } from '../api/endpoints';
import Navbar from '../components/Navbar';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    is_verified: false,
    streak_count: 0,
    badges: "[]"
  });
  const [allBadges, setAllBadges] = useState([]);
  const [passwords, setPasswords] = useState({
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const [uRes, sRes] = await Promise.all([getMe(), getProductivityStats()]);
        setUser(uRes.data);
        setAllBadges(sRes.data.all_badges_meta || []);
      } catch (err) {
        toast.error('Profil bilgileri alınamadı.');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        email: user.email
      };
      
      if (passwords.new_password) {
        if (passwords.new_password !== passwords.confirm_password) {
          toast.error('Şifreler eşleşmiyor!');
          setSaving(false);
          return;
        }
        if (passwords.new_password.length < 6) {
          toast.error('Yeni şifre en az 6 karakter olmalı!');
          setSaving(false);
          return;
        }
        payload.password = passwords.new_password;
      }

      const res = await updateMe(payload);
      const updatedUser = res.data;
      setUser(updatedUser);
      setPasswords({ new_password: '', confirm_password: '' });
      toast.success('Profil başarıyla güncellendi!');
      localStorage.setItem('userEmail', updatedUser.email);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Güncelleme başarısız oldu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="layout-root">
        <Navbar />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 className="spin" size={40} color="#6C63FF" />
        </main>
      </div>
    );
  }

  return (
    <div className="layout-root">
      <Navbar />
      <Toaster position="top-right" />
      
      <main className="main-content">
        <div className="page-header" style={{ marginBottom: 32 }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Hesabım 👤</h1>
            <p className="text-gray-400">Kişisel bilgilerinizi ve hesap ayarlarınızı buradan yönetebilirsiniz.</p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="auth-card" 
          style={{ maxWidth: 800, margin: '0 0' }}
        >
          {/* Stats Header */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 32, padding: 20, background: 'var(--bg-card-hover)', borderRadius: 16, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(108,99,255,0.1)', color: 'var(--accent-1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={22} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mevcut Seri</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{user.streak_count || 0} Gün</div>
              </div>
            </div>
            
            <div style={{ width: 1, background: 'var(--border)' }} />

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Award size={14} /> Kazanılan Rozetler
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(() => {
                  const badgeList = Array.isArray(user.badges) ? user.badges : JSON.parse(user.badges || "[]");
                  if (badgeList.length === 0) return <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Henüz rozet kazanılmadı</span>;
                  
                  return badgeList.map(bId => {
                    const badge = allBadges.find(a => a.id === bId);
                    return (
                      <div key={bId} title={badge?.desc} style={{
                        padding: '4px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', 
                        color: 'var(--success)', fontSize: 11, fontWeight: 700, border: '1px solid var(--border-accent)'
                      }}>
                        🏆 {badge?.name || bId}
                      </div>
                    )
                  });
                })()}
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
              
              {/* Personal Info Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: 18, borderBottom: '1px solid var(--border)', paddingBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={18} color="#6C63FF" /> Kişisel Bilgiler
                </h3>
                
                <div style={{ display: 'flex', gap: 16 }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Ad</label>
                    <div className="input-wrapper">
                      <input className="input" value={user.first_name || ''} onChange={e => setUser({...user, first_name: e.target.value})} required />
                    </div>
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Soyad</label>
                    <div className="input-wrapper">
                      <input className="input" value={user.last_name || ''} onChange={e => setUser({...user, last_name: e.target.value})} required />
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">E-posta</label>
                  <div className="input-wrapper">
                    <Mail size={16} className="input-icon" />
                    <input className="input" value={user.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                  </div>
                  {user.is_verified && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, color: '#22C55E', fontSize: 12 }}>
                      <ShieldCheck size={14} /> Onaylı Hesap
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <label className="input-label">Telefon Numarası</label>
                  <div className="input-wrapper">
                    <Phone size={16} className="input-icon" />
                    <input className="input" value={user.phone_number || ''} onChange={e => setUser({...user, phone_number: e.target.value})} placeholder="Örn: 0555..." />
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: 18, borderBottom: '1px solid var(--border)', paddingBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Lock size={18} color="#6C63FF" /> Şifre Değiştir
                </h3>
                <p style={{ fontSize: 12, color: '#8892AA' }}>Şifrenizi değiştirmek istemiyorsanız bu alanları boş bırakabilirsiniz.</p>

                <div className="input-group">
                  <label className="input-label">Yeni Şifre</label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon" />
                    <input className="input" type="password" value={passwords.new_password} onChange={e => setPasswords({...passwords, new_password: e.target.value})} />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Yeni Şifre (Tekrar)</label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon" />
                    <input className="input" type="password" value={passwords.confirm_password} onChange={e => setPasswords({...passwords, confirm_password: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 40, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <motion.button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ height: 48, padding: '0 32px' }}
              >
                {saving ? <Loader2 className="spin" size={20} /> : <><Save size={18} /> Güncelle</>}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </main>

      <style>{`
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

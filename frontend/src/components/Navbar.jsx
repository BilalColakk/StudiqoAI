import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, CalendarCheck, ClipboardList,
  Clock, LogOut, Brain, ChevronRight, User, Menu, X, Sun, Moon,
  TrendingUp
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { to: '/dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/courses',     label: 'Dersler',       icon: BookOpen        },
  { to: '/exams',       label: 'Sınavlar',      icon: CalendarCheck   },
  { to: '/study-plan',  label: 'Çalışma Planı', icon: ClipboardList   },
  { to: '/analytics',   label: 'Analiz',        icon: TrendingUp      },
  { to: '/availability',label: 'Müsaitlik',     icon: Clock           },
  { to: '/profile',     label: 'Hesabım',       icon: User            },
];

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  
  const email     = localStorage.getItem('userEmail') || 'Kullanıcı';
  const initials  = email.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const NavContent = () => (
    <>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', marginBottom: 36 }}>
        <div style={{
          width: 36, height: 36,
          background: 'linear-gradient(135deg, #6C63FF, #00D2FF)',
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(108,99,255,0.4)',
          flexShrink: 0,
        }}>
          <Brain size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            Studiqo
          </div>
          <div style={{ fontSize: 10, color: '#8892AA', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Study Planner
          </div>
        </div>
        <button className="mobile-only" onClick={() => setIsOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#8892AA' }}>
          <X size={24} />
        </button>
        {/* Desktop Theme Toggle */}
        <button 
          className="desktop-only" 
          onClick={toggleTheme}
          style={{ 
            marginLeft: 'auto', background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            color: '#F0F4FF', width: 32, height: 32, 
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <NavLink key={to} to={to} style={{ textDecoration: 'none' }} onClick={() => setIsOpen(false)}>
              <motion.div
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: active ? 'rgba(108,99,255,0.15)' : 'transparent',
                  border: active ? '1px solid rgba(108,99,255,0.3)' : '1px solid transparent',
                  color: active ? '#6C63FF' : '#8892AA',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    style={{
                      position: 'absolute', left: 0, top: 6, bottom: 6,
                      width: 3, background: 'linear-gradient(180deg, #6C63FF, #00D2FF)',
                      borderRadius: '0 3px 3px 0',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon size={17} />
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>{label}</span>
                {active && (
                  <ChevronRight size={13} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                )}
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6C63FF, #00D2FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {email}
            </div>
            <div style={{ fontSize: 10, color: '#8892AA' }}>Profil Ayarları</div>
          </div>
        </div>

        <motion.button
          whileHover={{ x: 3 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 10,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.15)',
            color: '#EF4444', cursor: 'pointer',
            fontSize: 13, fontWeight: 500,
            fontFamily: "'Inter', sans-serif",
            width: '100%',
          }}
        >
          <LogOut size={16} />
          Çıkış Yap
        </motion.button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="mobile-header" style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, height: 60,
        background: 'rgba(13,17,23,0.9)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'none', alignItems: 'center', padding: '0 20px',
        zIndex: 90
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Brain size={24} color="#6C63FF" />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>Studiqo</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button onClick={toggleTheme} style={{ background: 'none', border: 'none', color: '#fff' }}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setIsOpen(true)} style={{ background: 'none', border: 'none', color: '#fff' }}>
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <motion.aside
        className="desktop-sidebar"
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: 'var(--sidebar-w)',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column',
          zIndex: 100, padding: '24px 16px',
        }}
      >
        <NavContent />
      </motion.aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed', top: 0, left: 0, bottom: 0, width: 280,
                background: '#0D1117', zIndex: 1001, padding: '24px 16px',
                display: 'flex', flexDirection: 'column'
              }}
            >
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-header { display: flex !important; }
          .mobile-only { display: block !important; }
          .desktop-only { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
          .desktop-only { display: flex !important; }
        }
      `}</style>
    </>
  );
}
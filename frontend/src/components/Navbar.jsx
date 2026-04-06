import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, CalendarCheck, ClipboardList,
  Clock, LogOut, Brain, ChevronRight
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/courses',     label: 'Dersler',       icon: BookOpen        },
  { to: '/exams',       label: 'Sınavlar',      icon: CalendarCheck   },
  { to: '/study-plan',  label: 'Çalışma Planı', icon: ClipboardList   },
  { to: '/availability',label: 'Müsaitlik',     icon: Clock           },
];

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const email     = localStorage.getItem('userEmail') || 'Kullanıcı';
  const initials  = email.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: 'var(--sidebar-w)',
        background: 'rgba(13,17,23,0.95)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        display: 'flex', flexDirection: 'column',
        zIndex: 100, padding: '24px 16px',
      }}
    >
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
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: '#F0F4FF', lineHeight: 1.1 }}>
            Studiqo
          </div>
          <div style={{ fontSize: 10, color: '#8892AA', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Study Planner
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
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
            <div style={{ fontSize: 12, fontWeight: 600, color: '#F0F4FF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {email}
            </div>
            <div style={{ fontSize: 10, color: '#8892AA' }}>Aktif Plan</div>
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
    </motion.aside>
  );
}
import { motion } from 'framer-motion';

export default function StatCard({ icon, label, value, sub, color = '#6C63FF', delay = 0 }) {
  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Accent glow */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 100, height: 100,
        background: color, borderRadius: '50%',
        filter: 'blur(50px)', opacity: 0.15,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 44, height: 44,
          background: `${color}22`,
          border: `1px solid ${color}44`,
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
          flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{
          fontSize: 32, fontWeight: 800,
          fontFamily: "'Space Grotesk', sans-serif",
          color: '#F0F4FF', letterSpacing: '-0.02em',
          lineHeight: 1,
        }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: '#8892AA', marginTop: 6, fontWeight: 500 }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: 12, color: color, marginTop: 4, fontWeight: 600 }}>
            {sub}
          </div>
        )}
      </div>
    </motion.div>
  );
}

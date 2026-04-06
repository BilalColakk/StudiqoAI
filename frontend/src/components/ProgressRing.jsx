import { motion } from 'framer-motion';

export default function ProgressRing({ percent = 0, size = 110, stroke = 8, color = '#6C63FF' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        {/* Progress */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontSize: size * 0.22, fontWeight: 800,
          fontFamily: "'Space Grotesk', sans-serif",
          color: '#F0F4FF',
        }}>
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  );
}

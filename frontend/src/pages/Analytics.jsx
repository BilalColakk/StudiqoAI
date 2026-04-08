import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Activity, Award, Calendar, 
  ChevronRight,Zap, Target, Clock
} from 'lucide-react';
import Navbar from '../components/Navbar';
import LoadingSkeleton from '../components/LoadingSkeleton';
import PageTransition from '../components/PageTransition';
import { getProductivityStats } from '../api/endpoints';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 10 }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 4 }}>{label}</p>
        <p style={{ color: 'var(--accent-1)', fontWeight: 700, fontSize: 14 }}>{payload[0].value} Puan</p>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await getProductivityStats();
      setStats(res.data);
    } catch {
      console.error("Stats could not be loaded");
    } finally {
      setLoading(false);
    }
  };

  // Heatmap calculation (last 30 days)
  const today = new Date();
  const calendarDays = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    calendarDays.push({
      date: dStr,
      count: stats?.heatmap?.[dStr] || 0
    });
  }

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <PageTransition>
          <div className="page-header">
            <h1 className="page-title">Verimlilik Analizi 📊</h1>
            <p className="page-subtitle">Çalışma alışkanlıklarını ve odak performansını incele</p>
          </div>

          {loading ? <LoadingSkeleton rows={4} height={120} /> : (
            <>
              {/* Stat Cards */}
              <div className="grid-3" style={{ marginBottom: 28 }}>
                <motion.div className="glass-card" initial={{ opacity: 0, scale: 0.9 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div className="icon-box" style={{ background: 'rgba(108,99,255,0.1)', color: 'var(--accent-1)' }}>
                      <Zap size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Güncel Seri</div>
                      <div style={{ fontSize: 24, fontWeight: 800 }}>{stats?.streak || 0} Gün</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div className="glass-card" initial={{ opacity: 0, scale: 0.9 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div className="icon-box" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--success)' }}>
                      <Award size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Kazanılan Rozetler</div>
                      <div style={{ fontSize: 24, fontWeight: 800 }}>{stats?.badges?.length || 0} adet</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div className="glass-card" initial={{ opacity: 0, scale: 0.9 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div className="icon-box" style={{ background: 'rgba(0,210,255,0.1)', color: 'var(--accent-2)' }}>
                      <Target size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ortalama Odak</div>
                      <div style={{ fontSize: 24, fontWeight: 800 }}>
                        {stats?.focus_scores?.length > 0 
                          ? Math.round(stats.focus_scores.reduce((a,b) => a + b.score, 0) / stats.focus_scores.length)
                          : 0}%
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Heatmap Section */}
              <motion.div className="glass-card" style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center' }}>
                  <Calendar size={16} style={{ marginRight: 8 }} /> Son 30 Günlük Aktivite
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
                  {calendarDays.map(day => {
                    const opacity = day.count === 0 ? 0.05 : day.count === 1 ? 0.3 : day.count === 2 ? 0.6 : 1;
                    return (
                      <div 
                        key={day.date}
                        title={`${day.date}: ${day.count} seans`}
                        style={{
                          width: 14, height: 14, borderRadius: 3,
                          background: `var(--accent-1)`,
                          opacity: opacity,
                          transition: 'all 0.2s'
                        }}
                      />
                    )
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12, fontSize: 10, color: 'var(--text-muted)' }}>
                  <span>Az</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0.05, 0.3, 0.6, 1].map(op => <div key={op} style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent-1)', opacity: op }} />)}
                  </div>
                  <span>Çok</span>
                </div>
              </motion.div>

              {/* Charts */}
              <div className="grid-2">
                <motion.div className="glass-card">
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>📈 Odak Skoru Trendi</h3>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <AreaChart data={stats?.focus_scores || []}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent-1)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="var(--accent-1)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="date" hide />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="score" stroke="var(--accent-1)" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                <motion.div className="glass-card">
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>🏆 Rozet Başarımları</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {stats?.all_badges_meta?.map(badge => {
                      const isOwned = stats?.badges?.includes(badge.id);
                      return (
                        <div key={badge.id} style={{ 
                          display: 'flex', alignItems: 'center', gap: 14, 
                          padding: '10px 14px', borderRadius: 12,
                          background: isOwned ? 'var(--bg-card-hover)' : 'rgba(0,0,0,0.02)',
                          opacity: isOwned ? 1 : 0.4,
                          border: isOwned ? '1px solid var(--border-accent)' : '1px solid var(--border)'
                        }}>
                          <div style={{ fontSize: 24 }}>{isOwned ? '🏆' : '🔒'}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{badge.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{badge.desc}</div>
                          </div>
                   
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </PageTransition>
      </main>
      <style>{`
        .icon-box { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
      `}</style>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell
} from 'recharts';
import {
  TrendingUp, Activity, Award, Calendar,
  Zap, Target, Clock, BookOpen
} from 'lucide-react';
import Navbar from '../components/Navbar';
import LoadingSkeleton from '../components/LoadingSkeleton';
import PageTransition from '../components/PageTransition';
import { getProductivityStats, getMe, updateMe } from '../api/endpoints';
import { useTranslation } from '../i18n';

const COURSE_COLORS = ['#6C63FF','#00D2FF','#F59E0B','#22C55E','#EF4444','#EC4899','#8B5CF6','#14B8A6'];

const FocusTooltip = ({ active, payload, label }) => {
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

const CourseTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 10 }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 4 }}>{label}</p>
        <p style={{ fontWeight: 700, fontSize: 14 }}>
          <span style={{ color: '#22C55E' }}>✓ {payload.find(p => p.dataKey === 'completed')?.value || 0}s</span>
          {' · '}
          <span style={{ color: '#EF4444' }}>✗ {payload.find(p => p.dataKey === 'skipped')?.value || 0}s</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(false);
  const [targetH, setTargetH] = useState(10);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [uRes, sRes] = await Promise.allSettled([
        getMe(),
        getProductivityStats()
      ]);
      if (uRes.status === 'fulfilled') {
        setUser(uRes.value.data);
        setTargetH(uRes.value.data.weekly_target_hours || 10);
      }
      if (sRes.status === 'fulfilled') {
        setStats(sRes.value.data);
      }
    } catch {
      toast.error(t('STATS_ERR'));
    } finally {
      setLoading(false);
    }
  };

  // Heatmap: son 30 gün
  const today = new Date();
  const calendarDays = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    calendarDays.push({
      date: dStr,
      label: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
      count: stats?.heatmap?.[dStr] || 0
    });
  }

  // Focus scores — tarih formatı kısat
  const focusScores = (stats?.focus_scores || []).map(s => ({
    ...s,
    label: new Date(s.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
  }));

  // Ders bazlı performans verisi
  const coursePerf = stats?.course_performance
    ? Object.entries(stats.course_performance).map(([name, data], i) => ({
        name: name.length > 10 ? name.slice(0, 10) + '…' : name,
        fullName: name,
        completed: parseFloat((data.completed_hours || 0).toFixed(1)),
        skipped: parseFloat((data.skipped_hours || 0).toFixed(1)),
        color: COURSE_COLORS[i % COURSE_COLORS.length],
      }))
    : [];

  const hasData = stats && (
    focusScores.length > 0 ||
    calendarDays.some(d => d.count > 0) ||
    coursePerf.length > 0
  );

  const totalCompletedHours = coursePerf.reduce((sum, cp) => sum + cp.completed, 0);
  const targetProgress = Math.min(100, Math.round((totalCompletedHours / (user?.weekly_target_hours || 10)) * 100));

  const handleUpdateTarget = async () => {
    try {
      await updateMe({ weekly_target_hours: targetH });
      setUser(p => ({ ...p, weekly_target_hours: targetH }));
      setEditTarget(false);
      toast.success(t('GOAL_UPDATED'));
    } catch {
      toast.error(t('GOAL_ERR'));
    }
  };

  return (
    <div className="app-layout">
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
      }} />
      <Navbar />
      <main className="main-content">
        <PageTransition>
          <div className="glow-orb" style={{ width: 400, height: 400, background: '#6C63FF', top: -150, right: -100, opacity: 0.05 }} />

          <div className="page-header">
            <h1 className="page-title">{t('ANALYTICS_TITLE')}</h1>
            <p className="page-subtitle">{t('ANALYTICS_SUB')}</p>
          </div>

          {loading ? <LoadingSkeleton rows={4} height={120} /> : (
            <>
              {/* Stat Cards */}
              <div className="grid-3" style={{ marginBottom: 28 }}>
                <motion.div className="glass-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div className="analytics-icon-box" style={{ background: 'rgba(108,99,255,0.1)', color: 'var(--accent-1)' }}>
                      <Zap size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('STAT_CURRENT_STREAK')}</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
                        {stats?.streak || 0} <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 400 }}>{t('DAYS_UNIT')}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div className="glass-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div className="analytics-icon-box" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--success)' }}>
                      <Award size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('STAT_BADGES')}</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
                        {stats?.badges?.length || 0} <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 400 }}>{t('UNITS_PIECE')}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Haftalık Hedef Kartı (Task 26) */}
                <motion.div className="glass-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div className="analytics-icon-box" style={{ background: 'rgba(236,72,153,0.1)', color: '#EC4899', width: 36, height: 36 }}>
                        <Target size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{t('STAT_WEEKLY_GOAL')}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                          {totalCompletedHours.toFixed(1)} / {user?.weekly_target_hours || 10} <span style={{ fontSize: 12, fontWeight: 400 }}>{t('HOURS_UNIT')}</span>
                        </div>
                      </div>
                    </div>
                    <button style={{ background: 'none', border: 'none', color: 'var(--accent-1)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }} onClick={() => setEditTarget(!editTarget)}>
                      {editTarget ? t('BTN_CANCEL') : t('BTN_EDIT')}
                    </button>
                  </div>

                  {editTarget ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="number" min="1" max="100" className="input" style={{ flex: 1, padding: '4px 10px', minHeight: 32 }}
                        value={targetH} onChange={e => setTargetH(Number(e.target.value))} />
                      <button className="btn btn-primary btn-sm" onClick={handleUpdateTarget}>{t('BTN_SAVE_GOAL')}</button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        <span>{t('PROGRESS_LABEL')}</span>
                        <span style={{ color: targetProgress >= 100 ? '#22C55E' : 'var(--text-primary)', fontWeight: 700 }}>%{targetProgress}</span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${targetProgress}%` }}
                          style={{ height: '100%', background: targetProgress >= 100 ? '#22C55E' : 'linear-gradient(90deg, #EC4899, #F59E0B)' }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>

                <motion.div className="glass-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.16 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div className="analytics-icon-box" style={{ background: 'rgba(0,210,255,0.1)', color: 'var(--accent-2)' }}>
                      <Target size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('STAT_AVG_FOCUS')}</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
                        {focusScores.length > 0
                          ? Math.round(focusScores.reduce((a, b) => a + b.score, 0) / focusScores.length)
                          : 0}<span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 400 }}>%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Empty state */}
              {!hasData ? (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{t('NO_ANALYTICS')}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 320, textAlign: 'center' }}>
                    {t('NO_ANALYTICS_SUB')}
                  </p>
                </div>
              ) : (
                <>
                  {/* Heatmap */}
                  <motion.div className="glass-card" style={{ marginBottom: 28 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                      <Calendar size={16} style={{ color: 'var(--accent-1)' }} /> Son 30 Günlük Aktivite
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
                      {calendarDays.map(day => {
                        const opacity = day.count === 0 ? 0.06 : day.count === 1 ? 0.35 : day.count === 2 ? 0.65 : 1;
                        return (
                          <div
                            key={day.date}
                            title={`${day.label}: ${day.count} seans`}
                            style={{
                              width: 16, height: 16, borderRadius: 4,
                              background: 'var(--accent-1)',
                              opacity,
                              transition: 'all 0.2s',
                              cursor: 'default',
                            }}
                          />
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 14, fontSize: 11, color: 'var(--text-muted)' }}>
                      <span>{t('HEATMAP_LESS')}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[0.06, 0.35, 0.65, 1].map(op => (
                          <div key={op} style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--accent-1)', opacity: op }} />
                        ))}
                      </div>
                      <span>{t('HEATMAP_MORE')}</span>
                    </div>
                  </motion.div>

                  <div className="grid-2" style={{ marginBottom: 28 }}>
                    {/* Odak skoru trendi */}
                    <motion.div className="glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>{t('FOCUS_TREND')}</h3>
                      {focusScores.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                          <Activity size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><br />{t('NO_SESSION')}
                        </div>
                      ) : (
                        <div style={{ width: '100%', height: 220 }}>
                          <ResponsiveContainer>
                            <AreaChart data={focusScores} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                              <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="var(--accent-1)" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="var(--accent-1)" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                              <XAxis
                                dataKey="label"
                                tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                                axisLine={false}
                                tickLine={false}
                                interval="preserveStartEnd"
                              />
                              <YAxis hide domain={[0, 100]} />
                              <Tooltip content={<FocusTooltip />} />
                              <Area type="monotone" dataKey="score" stroke="var(--accent-1)" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--accent-1)' }} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </motion.div>

                    {/* Rozet başarımları */}
                    <motion.div className="glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>{t('BADGE_TITLE')}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(stats?.all_badges_meta || []).map(badge => {
                          const isOwned = stats?.badges?.includes(badge.id);
                          return (
                            <div key={badge.id} style={{
                              display: 'flex', alignItems: 'center', gap: 14,
                              padding: '10px 14px', borderRadius: 12,
                              background: isOwned ? 'rgba(34,197,94,0.06)' : 'rgba(0,0,0,0.02)',
                              opacity: isOwned ? 1 : 0.45,
                              border: isOwned ? '1px solid rgba(34,197,94,0.2)' : '1px solid var(--border)',
                              transition: 'all 0.2s',
                            }}>
                              <div style={{ fontSize: 22, flexShrink: 0 }}>{isOwned ? '🏆' : '🔒'}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{badge.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{badge.desc}</div>
                              </div>
                              {isOwned && (
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#22C55E', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>
                                  {t('BADGE_EARNED')}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </div>

                  {/* Ders bazlı performans */}
                  {coursePerf.length > 0 && (
                    <motion.div className="glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                        <BookOpen size={16} style={{ color: 'var(--accent-1)' }} /> {t('COURSE_CHART')}
                      </h3>
                      <div style={{ width: '100%', height: 220 }}>
                        <ResponsiveContainer>
                          <BarChart data={coursePerf} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CourseTooltip />} />
                            <Bar dataKey="completed" name={t('COMPLETED')} stackId="a" radius={[0, 0, 0, 0]} fill="#22C55E">
                              {coursePerf.map((_, i) => <Cell key={i} fill="#22C55E" fillOpacity={0.7} />)}
                            </Bar>
                            <Bar dataKey="skipped" name={t('SKIPPED')} stackId="a" radius={[4, 4, 0, 0]} fill="#EF4444">
                              {coursePerf.map((_, i) => <Cell key={i} fill="#EF4444" fillOpacity={0.6} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 12, fontSize: 12 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#22C55E', opacity: 0.7 }} /> {t('COMPLETED')}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#EF4444', opacity: 0.6 }} /> {t('SKIPPED')}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </>
          )}
        </PageTransition>
      </main>
      <style>{`
        .analytics-icon-box {
          width: 48px; height: 48px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}

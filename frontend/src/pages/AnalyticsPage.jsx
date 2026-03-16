import { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid,
} from 'recharts'
import { getStats } from '../services/transactions'
import styles from './AnalyticsPage.module.css'

const fmt = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStats()
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className={styles.loading}>Chargement des analyses...</div>
  if (!stats) return null

  const pieData = (stats.by_category || [])
    .filter((c) => c.type === 'expense' && c.total < 0)
    .map((c) => ({ name: c.name, value: Math.abs(c.total), color: c.color }))
    .sort((a, b) => b.value - a.value)

  const byMonth = (stats.by_month || []).map((item) => {
    const [, month] = item.month.split('-')
    return {
      name: MONTHS_FR[parseInt(month) - 1],
      Revenus: item.income,
      Dépenses: Math.abs(item.expense),
      Solde: item.income + item.expense,
    }
  })

  const totalExpense = pieData.reduce((s, c) => s + c.value, 0)
  const totalIncome = stats.total_income || 0
  const savingsRate = totalIncome > 0 ? ((totalIncome - Math.abs(stats.total_expense)) / totalIncome * 100) : 0

  // Top 5 dépenses par catégorie
  const top5 = [...pieData].slice(0, 5)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Analyses financières</h1>
        <p className={styles.sub}>Vue détaillée de vos habitudes financières</p>
      </div>

      {/* KPI strip */}
      <div className={styles.kpis}>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Taux d'épargne</div>
          <div className={styles.kpiVal} style={{ color: savingsRate >= 20 ? '#22c55e' : savingsRate >= 10 ? '#f97316' : '#ef4444' }}>
            {savingsRate.toFixed(1)}%
          </div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Mois analysés</div>
          <div className={styles.kpiVal} style={{ color: '#c9a84c' }}>{byMonth.length}</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Catégories actives</div>
          <div className={styles.kpiVal} style={{ color: '#a855f7' }}>{pieData.length}</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Dépense moy./mois</div>
          <div className={styles.kpiVal} style={{ color: '#ef4444' }}>
            {byMonth.length > 0 ? fmt(totalExpense / byMonth.length) : '—'}
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        {/* Donut chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Répartition des dépenses</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(val) => fmt(val)} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.legend}>
                {pieData.map((c) => (
                  <div key={c.name} className={styles.legendItem}>
                    <div className={styles.legendDot} style={{ background: c.color }} />
                    <span className={styles.legendName}>{c.name}</span>
                    <span className={styles.legendVal}>{fmt(c.value)}</span>
                    <span className={styles.legendPct}>{(c.value / totalExpense * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.empty}>Aucune dépense enregistrée</div>
          )}
        </div>

        {/* Bar chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Évolution mensuelle</h3>
          {byMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byMonth} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(val) => fmt(val)} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v}</span>} />
                <Bar dataKey="Revenus" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.empty}>Données insuffisantes</div>
          )}
        </div>

        {/* Solde line chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Solde mensuel (tendance)</h3>
          {byMonth.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={byMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(val) => fmt(val)} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="Solde" stroke="#c9a84c" strokeWidth={2} dot={{ fill: '#c9a84c', strokeWidth: 0, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.empty}>Données insuffisantes (min 2 mois)</div>
          )}
        </div>

        {/* Top 5 */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Top 5 des dépenses</h3>
          <div className={styles.top5}>
            {top5.map((c, i) => (
              <div key={c.name} className={styles.topRow}>
                <span className={styles.topRank}>{i + 1}</span>
                <div className={styles.topBar}>
                  <div className={styles.topBarFill} style={{ width: `${(c.value / top5[0].value * 100).toFixed(0)}%`, background: c.color }} />
                </div>
                <span className={styles.topName}>{c.name}</span>
                <span className={styles.topVal} style={{ color: c.color }}>{fmt(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

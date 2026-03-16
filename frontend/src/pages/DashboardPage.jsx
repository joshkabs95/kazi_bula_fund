import { useState, useEffect, useCallback } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { getTransactions, deleteTransaction, getStats } from '../services/transactions'
import KpiCard from '../components/KpiCard'
import CategoryCards from '../components/CategoryCards'
import TransactionForm from '../components/TransactionForm'
import ImportModal from '../components/ImportModal'
import InsightsBanner from '../components/InsightsBanner'
import styles from './DashboardPage.module.css'

const fmt = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

export default function DashboardPage() {
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingTx, setEditingTx] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [txRes, statsRes] = await Promise.all([
        getTransactions({ page_size: 10 }),
        getStats(),
      ])
      setTransactions(txRes.data.results || txRes.data)
      setStats(statsRes.data)
    } catch (e) {
      console.error('Erreur chargement données', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette transaction ?')) return
    try {
      await deleteTransaction(id)
      loadData()
    } catch (e) {
      alert('Erreur lors de la suppression.')
    }
  }

  const byMonth = (stats?.by_month || []).map((item) => {
    const [, month] = item.month.split('-')
    return {
      name: MONTHS_FR[parseInt(month) - 1],
      Revenus: item.income,
      Dépenses: Math.abs(item.expense),
    }
  })

  const pieData = (stats?.by_category || [])
    .filter((c) => c.type === 'expense' && c.total < 0)
    .map((c) => ({ name: c.name, value: Math.abs(c.total), color: c.color }))

  return (
    <div className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Tableau de bord</h1>
          <p className={styles.pageSubtitle}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className="btn btn-outline" onClick={() => setShowImport(true)}>
            📤 Relevé bancaire
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Ajouter
          </button>
        </div>
      </header>

      <div className={styles.tabs}>
        {[['overview','Vue globale'],['categories','Catégories'],['transactions','Transactions']].map(([id, label]) => (
          <button key={id} className={`${styles.tab} ${activeTab === id ? styles.tabActive : ''}`} onClick={() => setActiveTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loadingState}>Chargement des données...</div>
      ) : (
        <>
          {activeTab === 'overview' && <InsightsBanner />}

          <div className={styles.kpiGrid}>
            <KpiCard title="Revenus" amount={stats?.total_income || 0} icon="📈" type="income" subtitle="Ce mois" />
            <KpiCard title="Dépenses" amount={stats?.total_expense || 0} icon="📉" type="expense" subtitle="Ce mois" />
            <KpiCard title="Solde" amount={stats?.balance || 0} icon="💳" type="neutral" subtitle="Balance totale" />
          </div>

          {activeTab === 'overview' && (
            <div className={styles.chartsGrid}>
              <div className="card">
                <h3 className={styles.chartTitle}>Répartition par catégorie</h3>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(val) => fmt(val)} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} labelStyle={{ color: 'var(--text-primary)' }} />
                      <Legend formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={styles.emptyChart}>Aucune dépense enregistrée</div>
                )}
              </div>

              <div className="card">
                <h3 className={styles.chartTitle}>Évolution mensuelle</h3>
                {byMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={byMonth} barSize={12}>
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(val) => fmt(val)} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                      <Legend formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>} />
                      <Bar dataKey="Revenus" fill="var(--accent-green)" radius={[4,4,0,0]} />
                      <Bar dataKey="Dépenses" fill="var(--accent-red)" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={styles.emptyChart}>Aucune donnée mensuelle</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'categories' && <CategoryCards stats={stats} />}

          {(activeTab === 'overview' || activeTab === 'transactions') && (
            <div className="card" style={{ marginTop: 24 }}>
              <div className={styles.tableHeader}>
                <h3 className={styles.chartTitle} style={{ margin: 0 }}>
                  {activeTab === 'overview' ? '10 dernières transactions' : 'Toutes les transactions'}
                </h3>
              </div>
              {transactions.length === 0 ? (
                <div className={styles.emptyChart}>
                  Aucune transaction. <button className={styles.linkBtn} onClick={() => setShowForm(true)}>Ajouter la première</button>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th><th>Libellé</th><th>Catégorie</th><th>Source</th><th style={{ textAlign: 'right' }}>Montant</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className={styles.dateCell}>{new Date(tx.date).toLocaleDateString('fr-FR')}</td>
                        <td>{tx.label}</td>
                        <td>
                          {tx.category_detail ? (
                            <span className={styles.catBadge} style={{ background: tx.category_detail.color + '22', color: tx.category_detail.color }}>
                              {tx.category_detail.icon} {tx.category_detail.name}
                            </span>
                          ) : <span className={styles.noCat}>—</span>}
                        </td>
                        <td>
                          <span className={`badge ${tx.source === 'import' ? 'badge-income' : 'badge-expense'}`}>{tx.source}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={tx.amount >= 0 ? 'amount-income' : 'amount-expense'}>
                            {tx.amount >= 0 ? '+' : ''}{fmt(tx.amount)}
                          </span>
                        </td>
                        <td>
                          <div className={styles.rowActions}>
                            <button className={styles.actionBtn} onClick={() => { setEditingTx(tx); setShowForm(true) }} title="Modifier">✏️</button>
                            <button className={styles.actionBtn} onClick={() => handleDelete(tx.id)} title="Supprimer">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {showForm && (
        <TransactionForm transaction={editingTx} onClose={() => { setShowForm(false); setEditingTx(null) }} onSuccess={loadData} />
      )}
      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onSuccess={loadData} />
      )}
    </div>
  )
}

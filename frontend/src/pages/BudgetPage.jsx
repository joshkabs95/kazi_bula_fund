import { useState, useEffect } from 'react'
import { getCategories, updateCategory } from '../services/categories'
import { getStats } from '../services/transactions'
import styles from './BudgetPage.module.css'

const fmt = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)

export default function BudgetPage() {
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState(null)
  const [editingLimit, setEditingLimit] = useState(null)
  const [limitValue, setLimitValue] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [catRes, statsRes] = await Promise.all([getCategories(), getStats()])
      setCategories(catRes.data.results || catRes.data)
      setStats(statsRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const getSpent = (catId) => {
    const found = stats?.by_category?.find((c) => c.id === catId)
    return found ? Math.abs(found.total) : 0
  }

  const handleSaveLimit = async (cat) => {
    try {
      await updateCategory(cat.id, { ...cat, budget_limit: parseFloat(limitValue) || null })
      setEditingLimit(null)
      load()
    } catch (e) {
      alert('Erreur de mise à jour.')
    }
  }

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Budget mensuel</h1>
          <p className={styles.sub}>Définissez et suivez vos limites par catégorie</p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Chargement...</div>
      ) : (
        <div className={styles.grid}>
          {expenseCategories.map((cat) => {
            const spent = getSpent(cat.id)
            const limit = cat.budget_limit ? parseFloat(cat.budget_limit) : null
            const pct = limit ? Math.min(100, (spent / limit) * 100) : null
            const isEditing = editingLimit === cat.id

            let statusColor = cat.color
            let statusLabel = null
            if (pct !== null) {
              if (pct >= 100) {
                statusColor = '#ef4444'
                statusLabel = { type: 'danger', text: `Budget dépassé ! (+${fmt(spent - limit)})` }
              } else if (pct >= 80) {
                statusColor = '#f97316'
                statusLabel = { type: 'warning', text: `Attention : ${(100 - pct).toFixed(0)}% restant (${fmt(limit - spent)})` }
              }
            }

            return (
              <div key={cat.id} className={styles.card} style={{ borderLeft: `3px solid ${statusColor}` }}>
                <div className={styles.cardTop}>
                  <div className={styles.catInfo}>
                    <div className={styles.catIcon} style={{ background: cat.color + '22', border: `1px solid ${cat.color}44` }}>
                      {cat.icon}
                    </div>
                    <div>
                      <div className={styles.catName}>{cat.name}</div>
                      <div className={styles.catCount}>{cat.transaction_count} transaction(s)</div>
                    </div>
                  </div>
                  <div className={styles.amountGroup}>
                    <div className={styles.spent} style={{ color: statusColor }}>{fmt(spent)}</div>
                    {limit && <div className={styles.limitLabel}>/ {fmt(limit)}</div>}
                  </div>
                </div>

                {pct !== null && (
                  <>
                    <div className={styles.progressBg}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${pct}%`, background: statusColor }}
                      />
                    </div>
                    <div className={styles.pctRow}>
                      <span style={{ color: statusColor, fontWeight: 700 }}>{pct.toFixed(0)}%</span>
                      <span className={styles.pctSub}>du budget utilisé</span>
                    </div>
                  </>
                )}

                {statusLabel && (
                  <div className={`${styles.alert} ${styles[statusLabel.type]}`}>
                    {statusLabel.type === 'danger' ? '🚨' : '⚠️'} {statusLabel.text}
                  </div>
                )}

                {isEditing ? (
                  <div className={styles.editRow}>
                    <input
                      type="number"
                      step="0.01"
                      value={limitValue}
                      onChange={(e) => setLimitValue(e.target.value)}
                      placeholder="Limite mensuelle (€)"
                      className={styles.limitInput}
                      autoFocus
                    />
                    <button className="btn btn-primary" style={{ padding: '7px 14px', fontSize: 12 }} onClick={() => handleSaveLimit(cat)}>OK</button>
                    <button className="btn btn-outline" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => setEditingLimit(null)}>✕</button>
                  </div>
                ) : (
                  <button
                    className={styles.editBtn}
                    onClick={() => { setEditingLimit(cat.id); setLimitValue(limit || '') }}
                  >
                    {limit ? '✏️ Modifier la limite' : '+ Définir une limite'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

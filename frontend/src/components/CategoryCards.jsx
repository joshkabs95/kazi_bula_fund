import styles from './CategoryCards.module.css'

export default function CategoryCards({ stats }) {
  const categories = stats?.by_category || []
  const expenses = categories.filter((c) => c.type === 'expense')
  const totalExpense = Math.abs(expenses.reduce((sum, c) => sum + (c.total < 0 ? c.total : 0), 0))

  const fmt = (n) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Math.abs(n))

  if (!expenses.length) {
    return (
      <div className={styles.empty}>
        <p>Aucune donnée par catégorie</p>
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {expenses.map((cat) => {
        const pct = totalExpense > 0 ? Math.abs(cat.total) / totalExpense * 100 : 0
        return (
          <div key={cat.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.catIcon} style={{ background: cat.color + '22', borderColor: cat.color + '44' }}>
                <span>{cat.icon}</span>
              </div>
              <div className={styles.catInfo}>
                <span className={styles.catName}>{cat.name}</span>
                <span className={styles.catCount}>{cat.count} transaction{cat.count > 1 ? 's' : ''}</span>
              </div>
              <div className={styles.catAmount} style={{ color: cat.color }}>
                {fmt(cat.total)}
              </div>
            </div>

            <div className={styles.bar}>
              <div
                className={styles.barFill}
                style={{ width: `${Math.min(pct, 100).toFixed(1)}%`, background: cat.color }}
              />
            </div>
            <span className={styles.pct}>{pct.toFixed(1)}% des dépenses</span>
          </div>
        )
      })}
    </div>
  )
}

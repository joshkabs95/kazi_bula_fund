import styles from './KpiCard.module.css'

export default function KpiCard({ title, amount, icon, type = 'neutral', subtitle }) {
  const formatAmount = (val) => {
    const abs = Math.abs(val)
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(abs)
  }

  return (
    <div className={`${styles.card} ${styles[type]}`}>
      <div className={styles.header}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.title}>{title}</span>
      </div>
      <div className={`${styles.amount} ${styles['amount_' + type]}`}>
        {type === 'expense' && amount < 0 ? '-' : ''}
        {formatAmount(amount)}
      </div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
    </div>
  )
}

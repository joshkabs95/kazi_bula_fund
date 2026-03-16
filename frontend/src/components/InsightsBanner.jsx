import { useState, useEffect } from 'react'
import { getInsights } from '../services/insights'
import styles from './InsightsBanner.module.css'

export default function InsightsBanner() {
  const [insights, setInsights] = useState([])

  useEffect(() => {
    getInsights()
      .then((r) => setInsights(r.data.insights || []))
      .catch(() => {})
  }, [])

  if (!insights.length) return null

  return (
    <div className={styles.wrap}>
      {insights.map((ins, i) => (
        <div key={i} className={`${styles.card} ${styles[ins.type]}`}>
          <span className={styles.icon}>{ins.icon}</span>
          <div className={styles.content}>
            <div className={styles.message}>{ins.message}</div>
            <div className={styles.suggestion}>{ins.suggestion}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

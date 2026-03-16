import { useState, useEffect } from 'react'
import { getGoals, createGoal, deleteGoal, contributeToGoal } from '../services/goals'
import styles from './GoalsPage.module.css'

const fmt = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)

const ICONS = ['🎯', '🏖️', '🚗', '🏠', '💻', '✈️', '📱', '🎓', '💍', '🏋️', '🐶', '🎸']
const COLORS = ['#c9a84c', '#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ec4899', '#10b981', '#f59e0b']

export default function GoalsPage() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [contributeModal, setContributeModal] = useState(null)
  const [contribAmount, setContribAmount] = useState('')
  const [form, setForm] = useState({ name: '', target_amount: '', deadline: '', icon: '🎯', color: '#c9a84c' })
  const [celebrating, setCelebrating] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await getGoals()
      setGoals(res.data.results || res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createGoal(form)
      setShowForm(false)
      setForm({ name: '', target_amount: '', deadline: '', icon: '🎯', color: '#c9a84c' })
      load()
    } catch (e) {
      alert('Erreur lors de la création.')
    }
  }

  const handleContribute = async (e) => {
    e.preventDefault()
    try {
      const res = await contributeToGoal(contributeModal.id, { amount: parseFloat(contribAmount) })
      setContributeModal(null)
      setContribAmount('')
      load()
      if (res.data.goal.progress_pct >= 100) {
        setCelebrating(res.data.goal)
        setTimeout(() => setCelebrating(null), 4000)
      }
    } catch (e) {
      alert('Erreur lors du versement.')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet objectif ?')) return
    await deleteGoal(id)
    load()
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Objectifs d'épargne</h1>
          <p className={styles.sub}>Suivez et atteignez vos objectifs financiers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Nouvel objectif</button>
      </div>

      {celebrating && (
        <div className={styles.celebration}>
          🎉 Félicitations ! Tu as atteint ton objectif <strong>{celebrating.name}</strong> !
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Chargement...</div>
      ) : goals.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎯</div>
          <p>Aucun objectif défini.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>Créer mon premier objectif</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {goals.map((goal) => (
            <div key={goal.id} className={styles.card} style={{ borderTop: `3px solid ${goal.color}` }}>
              <div className={styles.cardHeader}>
                <div className={styles.goalIcon} style={{ background: goal.color + '22', border: `1px solid ${goal.color}44` }}>
                  {goal.icon}
                </div>
                <div className={styles.goalInfo}>
                  <div className={styles.goalName}>{goal.name}</div>
                  {goal.deadline && (
                    <div className={styles.goalDeadline}>
                      Objectif : {new Date(goal.deadline).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </div>
                  )}
                </div>
                <button className={styles.deleteBtn} onClick={() => handleDelete(goal.id)} title="Supprimer">🗑️</button>
              </div>

              <div className={styles.amounts}>
                <span className={styles.current} style={{ color: goal.color }}>{fmt(goal.current_amount)}</span>
                <span className={styles.separator}>/</span>
                <span className={styles.target}>{fmt(goal.target_amount)}</span>
              </div>

              <div className={styles.progressWrap}>
                <div className={styles.progressBg}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${goal.progress_pct}%`,
                      background: goal.color,
                    }}
                  />
                </div>
                <span className={styles.pct} style={{ color: goal.color }}>{goal.progress_pct}%</span>
              </div>

              {goal.forecast_date && goal.progress_pct < 100 && (
                <div className={styles.forecast}>
                  📅 Prévision d'atteinte : {new Date(goal.forecast_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </div>
              )}

              {goal.progress_pct >= 100 ? (
                <div className={styles.achieved}>🎉 Objectif atteint !</div>
              ) : (
                <button
                  className={styles.contributeBtn}
                  style={{ background: goal.color + '22', color: goal.color, border: `1px solid ${goal.color}44` }}
                  onClick={() => setContributeModal(goal)}
                >
                  + Verser de l'argent
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Goal Modal */}
      {showForm && (
        <div className={styles.overlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Nouvel objectif</h2>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form className={styles.form} onSubmit={handleCreate}>
              <div className={styles.field}>
                <label>Nom de l'objectif *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ex: Vacances été 2026" />
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Montant cible (€) *</label>
                  <input required type="number" step="0.01" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} placeholder="ex: 2000" />
                </div>
                <div className={styles.field}>
                  <label>Date limite</label>
                  <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                </div>
              </div>
              <div className={styles.field}>
                <label>Icône</label>
                <div className={styles.iconGrid}>
                  {ICONS.map((ic) => (
                    <button key={ic} type="button" className={`${styles.iconBtn} ${form.icon === ic ? styles.iconActive : ''}`} onClick={() => setForm({ ...form, icon: ic })}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.field}>
                <label>Couleur</label>
                <div className={styles.colorGrid}>
                  {COLORS.map((c) => (
                    <button key={c} type="button" className={`${styles.colorBtn} ${form.color === c ? styles.colorActive : ''}`} style={{ background: c }} onClick={() => setForm({ ...form, color: c })} />
                  ))}
                </div>
              </div>
              <div className={styles.actions}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {contributeModal && (
        <div className={styles.overlay} onClick={() => setContributeModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className={styles.modalHeader}>
              <h2>Versement — {contributeModal.name}</h2>
              <button className={styles.closeBtn} onClick={() => setContributeModal(null)}>✕</button>
            </div>
            <form className={styles.form} onSubmit={handleContribute}>
              <div className={styles.field}>
                <label>Montant à verser (€) *</label>
                <input required type="number" step="0.01" min="0.01" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} placeholder="ex: 200" autoFocus />
              </div>
              <div className={styles.remainInfo}>
                Reste à atteindre : <strong style={{ color: contributeModal.color }}>{fmt(contributeModal.remaining)}</strong>
              </div>
              <div className={styles.actions}>
                <button type="button" className="btn btn-outline" onClick={() => setContributeModal(null)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Verser</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

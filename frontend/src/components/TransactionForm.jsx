import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { createTransaction, updateTransaction } from '../services/transactions'
import { getCategories } from '../services/categories'
import styles from './TransactionForm.module.css'

export default function TransactionForm({ transaction, onClose, onSuccess }) {
  const [categories, setCategories] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: transaction ? {
      label: transaction.label,
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date,
    } : {
      date: new Date().toISOString().split('T')[0],
    }
  })

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data.results || res.data))
  }, [])

  const onSubmit = async (data) => {
    setLoading(true)
    setError(null)
    try {
      if (transaction) {
        await updateTransaction(transaction.id, data)
      } else {
        await createTransaction(data)
      }
      onSuccess()
      onClose()
    } catch (e) {
      const msg = e.response?.data
      if (typeof msg === 'object') {
        setError(Object.values(msg).flat().join(' '))
      } else {
        setError('Une erreur est survenue.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{transaction ? 'Modifier la transaction' : 'Nouvelle transaction'}</h2>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.field}>
            <label>Montant (€) *</label>
            <input
              type="number"
              step="0.01"
              placeholder="ex: -45.50 ou 2800"
              {...register('amount', {
                required: 'Le montant est requis',
                validate: v => v !== 0 || 'Le montant ne peut pas être zéro',
              })}
            />
            {errors.amount && <span className={styles.error}>{errors.amount.message}</span>}
            <small>Négatif = dépense, Positif = revenu</small>
          </div>

          <div className={styles.field}>
            <label>Libellé *</label>
            <input
              type="text"
              placeholder="ex: Carrefour, Loyer..."
              {...register('label', { required: 'Le libellé est requis' })}
            />
            {errors.label && <span className={styles.error}>{errors.label.message}</span>}
          </div>

          <div className={styles.field}>
            <label>Catégorie</label>
            <select {...register('category')}>
              <option value="">-- Sans catégorie --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label>Date *</label>
            <input
              type="date"
              {...register('date', { required: 'La date est requise' })}
            />
            {errors.date && <span className={styles.error}>{errors.date.message}</span>}
          </div>

          {error && <div className={styles.globalError}>{error}</div>}

          <div className={styles.actions}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Enregistrement...' : (transaction ? 'Modifier' : 'Ajouter')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

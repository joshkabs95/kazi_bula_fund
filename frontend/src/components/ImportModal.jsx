import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadDocument, importDocument } from '../services/documents'
import { getCategories } from '../services/categories'
import styles from './ImportModal.module.css'

export default function ImportModal({ onClose, onSuccess }) {
  const [step, setStep] = useState('upload') // upload | preview | done
  const [transactions, setTransactions] = useState([])
  const [selected, setSelected] = useState({})
  const [categories, setCategories] = useState([])
  const [docId, setDocId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [importResult, setImportResult] = useState(null)

  const onDrop = useCallback(async (files) => {
    if (!files.length) return
    setLoading(true)
    setError(null)
    try {
      const [catsRes, uploadRes] = await Promise.all([
        getCategories(),
        uploadDocument(files[0]),
      ])
      const cats = catsRes.data.results || catsRes.data
      setCategories(cats)
      setDocId(uploadRes.data.document_id)

      const txs = uploadRes.data.transactions || []
      setTransactions(txs)

      const initSelected = {}
      txs.forEach((_, i) => { initSelected[i] = true })
      setSelected(initSelected)
      setStep('preview')
    } catch (e) {
      setError(e.response?.data?.detail || 'Erreur lors du parsing du fichier.')
    } finally {
      setLoading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/csv': ['.csv'], 'text/plain': ['.csv'] },
    multiple: false,
  })

  const toggleAll = (checked) => {
    const next = {}
    transactions.forEach((_, i) => { next[i] = checked })
    setSelected(next)
  }

  const toggleOne = (i) => {
    setSelected((prev) => ({ ...prev, [i]: !prev[i] }))
  }

  const changeCategory = (i, catId) => {
    setTransactions((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], category_id: catId ? parseInt(catId) : null }
      return next
    })
  }

  const selectedTxs = transactions.filter((_, i) => selected[i])
  const totalSelected = selectedTxs.reduce((sum, tx) => sum + tx.amount, 0)

  const handleImport = async () => {
    if (!selectedTxs.length) return
    setLoading(true)
    setError(null)
    try {
      const res = await importDocument(docId, selectedTxs)
      setImportResult(res.data)
      setStep('done')
      onSuccess()
    } catch (e) {
      setError(e.response?.data?.detail || 'Erreur lors de l\'import.')
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
  const allChecked = transactions.length > 0 && transactions.every((_, i) => selected[i])

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Import relevé bancaire</h2>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        {step === 'upload' && (
          <div>
            <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}>
              <input {...getInputProps()} />
              <div className={styles.dropIcon}>📂</div>
              <p className={styles.dropText}>
                {isDragActive ? 'Déposez ici...' : 'Glissez un fichier PDF ou CSV'}
              </p>
              <p className={styles.dropSub}>ou cliquez pour sélectionner</p>
            </div>
            {loading && <div className={styles.loading}>Analyse en cours...</div>}
            {error && <div className={styles.errorBox}>{error}</div>}
          </div>
        )}

        {step === 'preview' && (
          <div className={styles.preview}>
            <div className={styles.previewHeader}>
              <label className={styles.checkAll}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
                Tout sélectionner ({transactions.length} transactions)
              </label>
              <span className={`${styles.total} ${totalSelected >= 0 ? styles.pos : styles.neg}`}>
                Total : {fmt(totalSelected)}
              </span>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th></th>
                    <th>Date</th>
                    <th>Libellé</th>
                    <th>Montant</th>
                    <th>Catégorie</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, i) => (
                    <tr key={i} className={tx.already_imported ? styles.duplicate : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!selected[i]}
                          onChange={() => toggleOne(i)}
                          disabled={tx.already_imported}
                        />
                      </td>
                      <td>{tx.date}</td>
                      <td className={styles.labelCell}>{tx.label}</td>
                      <td className={tx.amount >= 0 ? styles.pos : styles.neg}>
                        {fmt(tx.amount)}
                      </td>
                      <td>
                        <select
                          value={tx.category_id || ''}
                          onChange={(e) => changeCategory(i, e.target.value)}
                          className={styles.catSelect}
                        >
                          <option value="">--</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.icon} {cat.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && <div className={styles.errorBox}>{error}</div>}

            <div className={styles.actions}>
              <button className="btn btn-outline" onClick={onClose}>Annuler</button>
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={loading || selectedTxs.length === 0}
              >
                {loading ? 'Import...' : `Importer ${selectedTxs.length} transaction(s)`}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && importResult && (
          <div className={styles.done}>
            <div className={styles.doneIcon}>✅</div>
            <h3>{importResult.imported} transaction(s) importée(s)</h3>
            {importResult.skipped > 0 && (
              <p>{importResult.skipped} transaction(s) ignorée(s) (doublons)</p>
            )}
            <button className="btn btn-primary" onClick={onClose}>Fermer</button>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../services/auth'
import { useAuth } from '../context/AuthContext'
import { getMe } from '../services/auth'
import styles from './AuthPage.module.css'

export default function LoginPage() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    setError(null)
    try {
      await login(data.email, data.password)
      const res = await getMe()
      setUser(res.data)
      navigate('/')
    } catch (e) {
      setError('Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>💰</div>
        <h1 className={styles.title}>Budget Manager</h1>
        <p className={styles.subtitle}>Connectez-vous à votre espace</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              placeholder="vous@exemple.fr"
              {...register('email', { required: 'L\'email est requis' })}
            />
            {errors.email && <span className={styles.err}>{errors.email.message}</span>}
          </div>

          <div className={styles.field}>
            <label>Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              {...register('password', { required: 'Le mot de passe est requis' })}
            />
            {errors.password && <span className={styles.err}>{errors.password.message}</span>}
          </div>

          {error && <div className={styles.globalErr}>{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className={styles.switch}>
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </p>

        <div className={styles.demo}>
          <span>Demo :</span> demo@budget.fr / Demo1234!
        </div>
      </div>
    </div>
  )
}

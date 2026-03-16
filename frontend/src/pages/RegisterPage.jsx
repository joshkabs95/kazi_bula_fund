import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerUser } from '../services/auth'
import { useAuth } from '../context/AuthContext'
import styles from './AuthPage.module.css'

export default function RegisterPage() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  const onSubmit = async (data) => {
    setLoading(true)
    setError(null)
    try {
      const res = await registerUser({
        email: data.email,
        username: data.email.split('@')[0],
        first_name: data.first_name,
        last_name: data.last_name,
        password: data.password,
        password2: data.password2,
      })
      setUser(res.user)
      navigate('/')
    } catch (e) {
      const msg = e.response?.data
      if (typeof msg === 'object') {
        setError(Object.values(msg).flat().join(' '))
      } else {
        setError('Erreur lors de la création du compte.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>💰</div>
        <h1 className={styles.title}>Créer un compte</h1>
        <p className={styles.subtitle}>Commencez à gérer votre budget</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Prénom</label>
              <input
                type="text"
                placeholder="Jean"
                {...register('first_name', { required: 'Requis' })}
              />
              {errors.first_name && <span className={styles.err}>{errors.first_name.message}</span>}
            </div>
            <div className={styles.field}>
              <label>Nom</label>
              <input
                type="text"
                placeholder="Dupont"
                {...register('last_name', { required: 'Requis' })}
              />
              {errors.last_name && <span className={styles.err}>{errors.last_name.message}</span>}
            </div>
          </div>

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
              {...register('password', {
                required: 'Requis',
                minLength: { value: 8, message: '8 caractères minimum' },
              })}
            />
            {errors.password && <span className={styles.err}>{errors.password.message}</span>}
          </div>

          <div className={styles.field}>
            <label>Confirmer le mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              {...register('password2', {
                required: 'Requis',
                validate: (v) => v === password || 'Les mots de passe ne correspondent pas',
              })}
            />
            {errors.password2 && <span className={styles.err}>{errors.password2.message}</span>}
          </div>

          {error && <div className={styles.globalErr}>{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p className={styles.switch}>
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}

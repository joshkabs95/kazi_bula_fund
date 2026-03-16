import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DashboardPage from '../pages/DashboardPage'
import GoalsPage from '../pages/GoalsPage'
import BudgetPage from '../pages/BudgetPage'
import AnalyticsPage from '../pages/AnalyticsPage'
import styles from './AppShell.module.css'

const NAV = [
  { path: '/',          icon: '📊', label: 'Tableau de bord' },
  { path: '/budget',    icon: '📋', label: 'Budget' },
  { path: '/analytics', icon: '📈', label: 'Analyses' },
  { path: '/goals',     icon: '🎯', label: 'Objectifs' },
]

export default function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>💰 Budget</div>
        <nav className={styles.nav}>
          {NAV.map((item) => (
            <button
              key={item.path}
              className={`${styles.navItem} ${location.pathname === item.path ? styles.navActive : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className={styles.footer}>
          <div className={styles.userRow}>
            <div className={styles.avatar}>{user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}</div>
            <div>
              <div className={styles.userName}>{user?.first_name} {user?.last_name}</div>
              <div className={styles.userEmail}>{user?.email}</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={logout}>Déconnexion</button>
        </div>
      </aside>

      <main className={styles.content}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
        </Routes>
      </main>
    </div>
  )
}

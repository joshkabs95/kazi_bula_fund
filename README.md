# 💰 Budget Master

Application fullstack de gestion des finances personnelles.

## Stack
- **Backend** : Django 4.2 + DRF + JWT + SQLite (dev) / PostgreSQL (prod)
- **Frontend** : React 18 + Vite + Recharts
- **VPS** : 72.62.21.162 (srv1404625.hstgr.cloud)

## Pages
| Page | URL | Description |
|------|-----|-------------|
| Tableau de bord | `/` | KPIs + graphiques + insights |
| Budget | `/budget` | Limites par catégorie + alertes 80/100% |
| Analyses | `/analytics` | Donut + barres + tendances + Top 5 |
| Objectifs | `/goals` | Épargne avec prévision automatique |
| Login | `/login` | Authentification JWT |
| Register | `/register` | Création de compte |

## Installation locale

### Backend
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed          # 6 mois de données demo
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

→ http://localhost:5173 — Login : **demo@budget.fr / Demo1234!**

## Déploiement VPS

```bash
ssh root@72.62.21.162
bash <(curl -s https://raw.githubusercontent.com/joshkabs95/kazi_bula_fund/main/deploy/deploy.sh)
```

→ http://72.62.21.162

## API Endpoints
```
POST   /api/auth/register/
POST   /api/auth/login/
POST   /api/auth/refresh/
GET    /api/categories/
GET    /api/transactions/          ?month=&category=&type=&search=
GET    /api/transactions/stats/
GET    /api/transactions/insights/
GET    /api/goals/
POST   /api/goals/:id/contribute/
POST   /api/documents/upload/
POST   /api/documents/:id/import/
```

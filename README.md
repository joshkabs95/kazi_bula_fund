# 💰 Budget Manager — Django + React

Application fullstack de gestion de budget personnel avec import de relevés bancaires PDF/CSV.

## Stack

- **Backend** : Django 4.2 + DRF + JWT (simplejwt)
- **Frontend** : React 18 + Vite + Recharts
- **Parsing** : pdfplumber (PDF) + pandas (CSV)
- **Auth** : JWT (access 60min, refresh 7j)

---

## 🚀 Installation rapide

### 1. Backend

```bash
cd budget-app/backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Migrations
python manage.py migrate

# Seed (catégories par défaut + données demo)
python manage.py seed

# Lancer le serveur
python manage.py runserver
```

Le backend tourne sur **http://127.0.0.1:8000**

### 2. Frontend

```bash
cd budget-app/frontend
npm install
npm run dev
```

Le frontend tourne sur **http://localhost:5173**

---

## 🔑 Compte de démonstration

Après `python manage.py seed` :

| Champ | Valeur |
|-------|--------|
| Email | `demo@budget.fr` |
| Mot de passe | `Demo1234!` |

---

## 📡 API Endpoints

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/api/auth/login/` | Connexion JWT |
| POST | `/api/auth/refresh/` | Refresh token |
| POST | `/api/auth/register/` | Inscription |
| GET | `/api/auth/me/` | Profil utilisateur |
| GET/POST | `/api/categories/` | Liste/création catégories |
| GET/POST | `/api/transactions/` | Liste/création transactions |
| GET | `/api/transactions/stats/` | Statistiques agrégées |
| PUT/DELETE | `/api/transactions/:id/` | Modification/suppression |
| POST | `/api/documents/upload/` | Upload PDF ou CSV |
| GET | `/api/documents/:id/preview/` | Preview transactions parsées |
| POST | `/api/documents/:id/import/` | Confirmer l'import |

---

## 🎨 Fonctionnalités

- **Dashboard** : KPIs (revenus/dépenses/solde), graphiques Recharts (camembert + barres mensuelles)
- **Transactions** : CRUD complet, filtres par catégorie/date/type
- **Catégories** : Grille avec barres de progression, % du total
- **Import bancaire** : Drag & drop PDF/CSV, catégorisation automatique par mots-clés, déduplication par hash
- **Auth JWT** : Access token 60min, refresh automatique, blacklist à la déconnexion

---

## 🤖 Catégorisation automatique

Les transactions importées sont catégorisées par analyse du libellé :

| Catégorie | Mots-clés détectés |
|-----------|-------------------|
| Alimentation | carrefour, auchan, mcdo, uber eats... |
| Logement | loyer, edf, charges, syndic... |
| Transport | sncf, ratp, uber, essence... |
| Loisirs | netflix, spotify, steam... |
| Services | sfr, orange, mutuelle... |
| Revenus | salaire, virement, caf... |

---

## 🔧 Variables d'environnement

Copier `.env.example` → `.env` dans le dossier `backend/` :

```env
SECRET_KEY=votre-clé-secrète
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

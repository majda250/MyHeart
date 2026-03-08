# MyHeart 🏥 — Système de Gestion des Soins de Santé

> Mini-projet Microservices — SUD : Architecture orientée services (SOA)  
> Réalisé avec Node.js, MongoDB, HTML/CSS/JS et Docker

---

## 📋 Description

MyHeart est un système de gestion hospitalière basé sur une **architecture microservices**.  
Il permet de gérer les patients, les rendez-vous, la facturation, les prescriptions et les rapports de laboratoire.

---

## 🏗️ Architecture
```
┌─────────────────────────────────────────────┐
│         FRONTEND (Nginx - port 8080)         │
│           HTML + CSS + JavaScript            │
└──────────────────┬──────────────────────────┘
                   │ REST API
     ┌─────────────┼─────────────┐
     │             │             │
┌────▼────┐  ┌─────▼────┐  ┌────▼────┐
│ Patient │  │Appointment│  │ Billing │
│ :3001   │◄─│ :3002     │─►│ :3003   │
│ MongoDB │  │ MongoDB   │  │ MongoDB │
└─────────┘  └──────────┘  └─────────┘

┌──────────────┐    ┌──────────────┐
│ Prescription │    │  Laboratoire │
│    :3004     │    │    :3005     │
│   MongoDB    │    │   MongoDB    │
└──────────────┘    └──────────────┘
```

---

## 🧩 Microservices

| Service | Port | Base de données | Rôle |
|---------|------|-----------------|------|
| patient-service | 3001 | MongoDB | Gestion des dossiers patients |
| appointment-service | 3002 | MongoDB | Gestion des rendez-vous |
| billing-service | 3003 | MongoDB | Facturation et paiements |
| prescription-service | 3004 | MongoDB | Ordonnances médicales |
| lab-service | 3005 | MongoDB | Rapports de laboratoire |
| frontend | 8080 | — | Interface utilisateur |

---

## ⚙️ Prérequis

- [Docker](https://docs.docker.com/get-docker/) installé sur votre machine
- [Docker Compose](https://docs.docker.com/compose/) (inclus avec Docker Desktop)
- Git

Vérifier l'installation :
```bash
docker --version
docker compose version
```

---

## 🚀 Installation et lancement

### 1. Cloner le projet
```bash
git clone git@github.com:majda250/MyHeart.git
cd MyHeart
```

### 2. Lancer tous les services avec Docker
```bash
docker compose up --build
```

> La première fois, le build peut prendre **5 à 15 minutes** (téléchargement des images Node.js et MongoDB).

### 3. Accéder à l'application

Ouvrir le navigateur et aller sur :
```
http://localhost:8080
```

---

## ✅ Vérifier que tout fonctionne

Dans un autre terminal, tester les health checks de chaque microservice :
```bash
curl http://localhost:3001/health   # Patient Service
curl http://localhost:3002/health   # Appointment Service
curl http://localhost:3003/health   # Billing Service
curl http://localhost:3004/health   # Prescription Service
curl http://localhost:3005/health   # Lab Service
```

Chaque réponse doit ressembler à :
```json
{"status":"UP","service":"patient-service","timestamp":"..."}
```

---

## 📡 API Endpoints

### Patient Service (port 3001)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /patients | Liste tous les patients |
| GET | /patients/:id | Détails d'un patient |
| POST | /patients | Créer un patient |
| PUT | /patients/:id | Modifier un patient |
| DELETE | /patients/:id | Supprimer un patient |

### Appointment Service (port 3002)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /appointments | Liste tous les rendez-vous |
| POST | /appointments | Créer un rendez-vous (génère une facture automatiquement) |
| PUT | /appointments/:id | Modifier un rendez-vous |
| DELETE | /appointments/:id | Supprimer un rendez-vous |

### Billing Service (port 3003)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /bills | Liste toutes les factures |
| POST | /bills | Créer une facture manuellement |
| PUT | /bills/:id/pay | Enregistrer un paiement |
| GET | /bills/stats/summary | Statistiques de facturation |

### Prescription Service (port 3004)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /prescriptions | Liste toutes les prescriptions |
| POST | /prescriptions | Créer une prescription |
| PUT | /prescriptions/:id | Modifier une prescription |
| DELETE | /prescriptions/:id | Supprimer une prescription |

### Lab Service (port 3005)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /lab-reports | Liste tous les rapports |
| POST | /lab-reports | Créer un rapport |
| PUT | /lab-reports/:id | Mettre à jour le statut |
| DELETE | /lab-reports/:id | Supprimer un rapport |

---

## 🔗 Communication entre services

Quand un **rendez-vous est créé**, l'appointment-service appelle automatiquement :
1. **patient-service** → pour vérifier que le patient existe
2. **billing-service** → pour générer une facture automatiquement

Cette communication est **synchrone via REST HTTP**.

---

## 🛑 Arrêter le projet
```bash
# Arrêter les conteneurs
docker compose down

# Arrêter ET supprimer les données (reset complet)
docker compose down -v
```

---

## 🗂️ Structure du projet
```
MyHeart/
├── docker-compose.yml
├── README.md
├── patient-service/
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── appointment-service/
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── billing-service/
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── prescription-service/
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── lab-service/
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
└── frontend/
    ├── index.html
    ├── Dockerfile
    ├── css/
    │   └── style.css
    └── js/
        ├── api.js
        ├── patients.js
        ├── modules.js
        └── dashboard.js
```

---

## 🛠️ Technologies utilisées

| Technologie | Usage |
|-------------|-------|
| Node.js + Express | Backend de chaque microservice |
| MongoDB + Mongoose | Base de données de chaque service |
| HTML / CSS / JavaScript | Interface frontend |
| Nginx | Serveur web pour le frontend |
| Docker + Docker Compose | Conteneurisation et orchestration |

---



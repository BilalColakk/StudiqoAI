<div align="center">

<img src="https://img.shields.io/badge/Studiqo-AI%20Study%20Planner-6C63FF?style=for-the-badge&logo=brain&logoColor=white" alt="Studiqo" />

# 🧠 Studiqo — AI-Powered Study Planner

**Öğrenciler için yapay zeka destekli, gamified çalışma planlama platformu**  
*AI-powered, gamified study planning platform for students*

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://postgresql.org)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[🇹🇷 Türkçe](#-türkçe) · [🇺🇸 English](#-english) · [🚀 Live Demo](#) · [📸 Screenshots](#-ekran-görüntüleri--screenshots)

</div>

---

<a name="türkçe"></a>
## 🇹🇷 Türkçe

**Studiqo**, öğrencilerin sınav hazırlık süreçlerini yapay zeka ile optimize eden, streak sistemi ve rozet kazanımlarıyla motive eden modern bir çalışma planlama platformudur.

### ✨ Özellikler

#### 🧠 AI Planlama Motoru
- Ders zorluğu, kredi saati ve sınav tarihine göre **ağırlıklı adaptif haftalık plan** oluşturma
- "Adaptif Plan" modu — geçmiş tamamlanma oranına göre planı yeniden düzenleme
- Sınav yakınlığına göre otomatik öncelik sıralaması

#### 🔥 Gamification Sistemi
- **Streak (Seri):** Her gün çalışarak serisini koru, 7 günlük ısı haritasıyla görselleştir
- **Rozet Sistemi:** Hedefe ulaştıkça otomatik kazanılan başarım rozetleri
- **Odak Skoru:** Her çalışma oturumu için hesaplanan odak puanı

#### ⏱️ Pomodoro & Odak Modu
- Çalışma sayacı — başlat / duraklat / devam et / sıfırla
- **FocusOverlay:** Dikkat dağıtan her şeyi kapatan tam ekran odak modu
- Sayfa yenileme sonrası oturum kalıcılığı (localStorage)
- Oturum bitince tarayıcı bildirimi + ses uyarısı

#### 📊 Verimlilik Analizi
- Ders bazlı çalışma süreleri — etkileşimli Pie Chart
- Tamamlanma oranı, atlanan & bekleyen oturum istatistikleri
- Haftalık hedef takibi

#### 🔐 Güvenli Kimlik Doğrulama
- JWT tabanlı oturum yönetimi
- Email doğrulama akışı
- Şifre sıfırlama (token ile)

#### 🎨 Kullanıcı Deneyimi
- **Dark / Light Mode** — CSS design token sistemi
- **TR / EN** tam dil desteği — navbar'dan tek tıkla geçiş
- Framer Motion animasyonları
- Mobil uyumlu (responsive sidebar → hamburger menü)
- Onboarding Wizard — yeni kullanıcılar için 3 adımlı kurulum rehberi

---

### 🛠️ Teknoloji Stack'i

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | React 19, Vite 8, Framer Motion, Recharts, Lucide React |
| **Backend** | FastAPI, Uvicorn, SQLAlchemy, Pydantic |
| **Veritabanı** | PostgreSQL |
| **Auth** | JWT (python-jose), Bcrypt |
| **Deploy** | Vercel (frontend), Render (backend) |

---

### 🚀 Kurulum

#### Gereksinimler
- Node.js 18+
- Python 3.10+
- PostgreSQL

#### Backend
```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

#### `.env` Değişkenleri

**Backend:**
```
DATABASE_URL=postgresql://user:password@localhost/studiqo
SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:5173
```

**Frontend:**
```
VITE_API_URL=http://localhost:8000
```

---

### 📁 Proje Yapısı

```
studiqo/
├── backend/
│   └── app/
│       ├── main.py          # FastAPI uygulaması & CORS
│       ├── models.py        # SQLAlchemy modelleri
│       ├── schemas.py       # Pydantic şemaları
│       ├── database.py      # DB bağlantısı
│       ├── config.py        # Ayarlar
│       └── routes/
│           ├── users.py     # Auth & kullanıcı işlemleri
│           ├── courses.py   # Ders yönetimi
│           ├── exams.py     # Sınav yönetimi
│           ├── plans.py     # AI plan motoru
│           └── availabilities.py
└── frontend/
    └── src/
        ├── pages/           # 12 sayfa (Dashboard, Courses, Exams...)
        ├── components/      # Navbar, FocusOverlay, OnboardingWizard...
        ├── api/             # Axios endpoints
        ├── context/         # Theme context
        └── i18n/            # TR/EN çeviriler
```

---

<a name="english"></a>
## 🇺🇸 English

**Studiqo** is a modern, gamified study planning platform that uses artificial intelligence to optimize students' exam preparation — keeping them motivated with streaks and achievement badges.

### ✨ Features

#### 🧠 AI Planning Engine
- **Weighted adaptive weekly plans** based on course difficulty, credits & exam dates
- "Adaptive Plan" mode — re-schedules based on past completion rates
- Automatic priority ranking by exam proximity

#### 🔥 Gamification
- **Streak System:** Maintain daily study streaks, visualized with a 7-day heatmap
- **Badge System:** Achievement badges earned automatically on milestones
- **Focus Score:** Calculated per session based on pause count

#### ⏱️ Pomodoro & Focus Mode
- Study timer — start / pause / resume / reset
- **FocusOverlay:** Fullscreen focus mode hiding all distractions
- Session persistence across page reloads (localStorage)
- Browser notification + audio alert on session completion

#### 📊 Productivity Analytics
- Course-level study hours — interactive Pie Chart
- Completion rate, skipped & pending session stats
- Weekly target tracking

#### 🔐 Secure Authentication
- JWT-based session management
- Email verification flow
- Password reset via token

#### 🎨 User Experience
- **Dark / Light Mode** — CSS design token system
- **TR / EN** full i18n — switch from navbar with one click
- Framer Motion animations throughout
- Mobile responsive (sidebar → hamburger drawer)
- Onboarding Wizard — 3-step setup guide for new users

---

### 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 8, Framer Motion, Recharts, Lucide React |
| **Backend** | FastAPI, Uvicorn, SQLAlchemy, Pydantic |
| **Database** | PostgreSQL |
| **Auth** | JWT (python-jose), Bcrypt |
| **Deploy** | Vercel (frontend), Render (backend) |

---

### 🚀 Setup

#### Requirements
- Node.js 18+
- Python 3.10+
- PostgreSQL

#### Backend
```bash
cd backend
cp .env.example .env        # Edit .env file
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
cp .env.example .env        # Set VITE_API_URL
npm install
npm run dev
```

---

### 📁 Project Structure

```
studiqo/
├── backend/
│   └── app/
│       ├── main.py          # FastAPI app & CORS
│       ├── models.py        # SQLAlchemy models
│       ├── schemas.py       # Pydantic schemas
│       ├── database.py      # DB connection
│       ├── config.py        # Settings
│       └── routes/
│           ├── users.py     # Auth & user management
│           ├── courses.py   # Course management
│           ├── exams.py     # Exam management
│           ├── plans.py     # AI plan engine
│           └── availabilities.py
└── frontend/
    └── src/
        ├── pages/           # 12 pages (Dashboard, Courses, Exams...)
        ├── components/      # Navbar, FocusOverlay, OnboardingWizard...
        ├── api/             # Axios endpoints
        ├── context/         # Theme context
        └── i18n/            # TR/EN translations
```

---

## 🤝 Contributing

Pull request'ler ve issue'lar memnuniyetle karşılanır.  
Pull requests and issues are welcome.

---

## 📄 License

[MIT](LICENSE)


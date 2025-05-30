# 🎓 LearNerds - Modern E-Learning Platform

<div align="center">
  
[![Tech Stack](https://img.shields.io/badge/Backend-Django-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Tech Stack](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Tech Stack](https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

[![Tech Stack](https://img.shields.io/badge/Architecture-Microservices-black?style=for-the-badge&logo=docker&logoColor=white)](https://microservices.io/)

</div>

---

## 📋 Table of Contents

- [🎯 Project Overview](#-project-overview)
- [✨ Key Features](#-key-features)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Installation & Setup](#-installation--setup)
- [🔧 Environment Configuration](#-environment-configuration)
- [🚢 Deployment](#-deployment)
- [🔮 Future Enhancements](#-future-enhancements)
- [🤝 Contributing](#-contributing)

---

## 🎯 Project Overview

**LearNerds** is a modern, full-stack e-learning platform that bridges the gap between knowledge seekers and educators. Built with a microservices architecture, it offers a scalable solution for online education. Users can seamlessly switch roles—anyone can learn, teach, or do both—supported by dual access models: freemium (ad-supported) and premium subscriptions

### 🌟 What Makes LearNerds Special?

- **🔄 Dual Role Flexibility**: Any user can be both a tutor and a student—learn or teach, anytime
- **📚 Dual Access Model**: Free courses with ads or premium subscriptions
- **👥 Personal Mentoring**: One-on-one video sessions with instructors
- **💬 Real-time Chat**: Direct communication between students and teachers
- **🎯 Adaptive Learning**: Personalized learning paths and progress tracking
- **💰 Creator Economy**: Fair monetization for content creators
- **📱 Responsive Design**: Seamless experience across all devices

---

## ✨ Key Features

### 🎓 For Learners
- **Course Discovery**: Browse courses across multiple categories
- **Flexible Learning**: Choose between free (with ads) or premium access
- **Personal Mentorship**: Connect mentor through chat and available video sessions
- **Interactive Learning**: Quizzes, assessments, and visual recorded sessions
- **Community Access**: Join discussions and connect with peers
- **Review & Report**: Share Feedback & report incase of violation. 

### 👨‍🏫 For Instructors
- **Course Creation**: Intuitive course builder with multimedia support
- **Revenue Streams**: Earn through ads and premium subscriptions
- **Student Analytics**: Track students enrollments
- **Direct Communication**: Chat and video call capabilities
- **Content Management**: Easy upload and organization of course materials
- **Flexible Pricing**: Set custom pricing for premium content

### 🔧 Admin Features
- **User Management**: Comprehensive user management
- **Content Moderation**: Review and resolve user rised issues
- **Analytics Dashboard**: Platform-wide statistics and insights
- **Sales Report**: Transactions report and download
- **Connect With User**: Chat with user, Create Community

---

## 🏗️ Architecture

LearNerds follows a **microservices architecture** for scalability and maintainability:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  API Gateway    │    │  Load Balancer  │
│                 │◄──►│   (Django)      │◄──►│                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
         ┌───────────────┌──────┼────────┐───────────────┐
         │               │               │               │
 ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐ ┌───────▼──────┐
 │ User Service │ │CourseService│ │Chat Service│ │ Admin Service│
 │              │ │             │ │            │ │              │
 └──────────────┘ └─────────────┘ └────────────┘ └──────────────┘
         │               │               │               │       
 ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐ ┌───────▼──────┐
 │  PostgreSQL  │ │ PostgreSQL  │ │  MongoDB   │ │  PostgreSQL  │
 │   Database   │ │  Database   │ │  Database  │ │   Database   │
 └──────────────┘ └─────────────┘ └────────────┘ └──────────────┘
```

### 🔄 Service Communication
- **API Gateway**: Centralized routing and authentication
- **Event-Driven**: Asynchronous communication between services using RabbitMQ
- **Database Per Service**: Each microservice owns its data
- **Containerized**: Docker containers for easy deployment

---

## 🛠️ Tech Stack

### Frontend
- **⚛️ React 18** - Modern UI library with hooks
- **🎨 Tailwind CSS** - Utility-first CSS framework
- **🔄 Redux Toolkit** - State management
- **💬 WebSocket** - for real-time features
- **🌐 Axios** - HTTP client for API calls
- **📱 Lucide React** - Beautiful icon library
- **⚡ Vite** - Lightning-fast build tool

### Backend
- **🐍 Django REST Framework** - Robust API development
- **🗄️ PostgreSQL** - Primary relational database (used across most services)
- **🍃 MongoDB** - NoSQL database (used in channel service)
- **🔐 JWT Authentication** - Secure token-based auth
- **📨 RabbitMQ** - Asynchronous communication between services
- **📧 Celery** - Asynchronous task processing and scheduled task (celery-beat)
- **📡 Django Channels** – WebSocket support and real-time communication
- **🧠 Redis** - Caching layer, Celery backend and Channel layers
- **🐳 Docker** - Containerization

### DevOps & Tools
- **☸️ Kubernetes (K8s)** – Container orchestration, deployment, scaling
- **🐳 Docker Compose** - Local multi-container setup for development and testing
- **🔧 Git** - Version control
- **🚀 GitHub Actions** – CI/CD pipelines for automated build, test, and deploy
- **☁️ GCP / AWS** – Cloud infrastructure and managed Kubernetes (GKE / EKS)
- **📊 Postman** - API testing
- **🖥️ VS Code** - Development environment

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **Python** (v3.9 or higher)
- **PostgreSQL** (v13 or higher)
- **Docker** & **Docker Compose**

### 🔧 Quick Start with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/nasif-muhamed/LearNerd.git
cd LearNerd

# Start all services with Docker Compose
cd server
docker-compose up -d

# Install frontend dependencies
cd ../client
npm install

# Start the React development server
npm run dev
```

### 🛠️ Manual Setup

#### Backend Setup
```bash
# Navigate to server directory
cd server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your configurations

# Run database migrations for each service
cd user_service && python manage.py migrate && cd ..
cd course_service && python manage.py migrate && cd ..
cd channel_service && python manage.py migrate && cd ..
cd admin_service && python manage.py migrate && cd ..
cd api_gateway_django && python manage.py migrate && cd ..

# Start each service (in separate terminals)
cd user_service && python manage.py runserver 8001
cd course_service && python manage.py runserver 8002
cd channel_service && python manage.py runserver 8003
cd admin_service && python manage.py runserver 8004
cd api_gateway_django && python manage.py runserver 8000
```

#### Frontend Setup
```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your API endpoints

# Start development server
npm run dev
```

---

## 🔧 Environment Configuration

### Backend (.env)
```env
# Database Configuration
DB_NAME=learnerds_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

# JWT Configuration
SECRET_KEY=your_super_secret_key
JWT_SECRET_KEY=your_jwt_secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password

# Redis Configuration
REDIS_URL=redis://localhost:6379

# AWS S3 Configuration (for file uploads)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_STORAGE_BUCKET_NAME=your_bucket_name
```

### Frontend (.env)
```env
# API Configuration
VITE_BASE_URL=http://localhost:8000/api
VITE_SOCKET_URL=ws://localhost:8004/ws

# Payment Gateway
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

### API Testing
- **Postman Collection**: Available in `/docs/api-collection.json`
- **Automated Testing**: GitHub Actions CI/CD pipeline

---

## 🚢 Deployment

### 🐳 Docker Deployment
```bash
# Build and deploy all services
docker-compose -f docker-compose.prod.yml up -d

# Scale specific services
docker-compose up -d --scale course_service=3
```

---

## 🔮 Future Enhancements
- [ ] **Live Streaming**: Real-time video streaming for classes
- [ ] **AI Recommendations**: Machine learning-based course suggestions
- [ ] **Gamification**: Points, badges, and leaderboards
- [ ] **AI Tutoring**: Chatbot teaching assistants


---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
5. Push to your branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

---

<div align="center">
  <img src="https://img.shields.io/github/stars/nasif-muhamed/LearNerd?style=social" alt="GitHub Stars" />
  <img src="https://img.shields.io/github/forks/nasif-muhamed/LearNerd?style=social" alt="GitHub Forks" />
  <img src="https://img.shields.io/github/watchers/nasif-muhamed/LearNerd?style=social" alt="GitHub Watchers" />
</div>


---

<div align="center">
  <h3>⭐ Star this repository if you found it helpful!</h3>
  <p>Built with ❤️ by <a href="https://github.com/nasif-muhamed">Nasif Muhamed</a> for self learners and passionate tutors</p>
</div>

---

## 👨‍💻 Developer Profile

**Muhamed Nasif** - Full Stack Developer

- 🎓 **Specialization**: Modern web development with React & Django
- 🏗️ **Architecture**: Microservices and scalable system design
- 🔧 **Skills**: Full-stack development, API design, database optimization
- 📫 **Contact**: [muhdnasifk@gmail.com](mailto:muhdnasifk@gmail.com)
- 💼 **LinkedIn**: [Muhamed Nasif](https://www.linkedin.com/in/muhamed-nasif-k/)
- 🐦 **Twitter**: [@LearNerdsApp](https://x.com/NasifMuhamed)
- 🌐 **Portfolio**: [Muhamed Nasif K](https://nasif-muhamed.github.io/portfolio/)

For technical support or quiries, please reach out through the channels above.
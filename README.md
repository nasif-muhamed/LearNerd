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
# setup .env file as per mentioned below, at the same location where docker-compose.yaml locates.
docker-compose up db -d

"""
create databases for admin_service and course_service. user_service will be automtically
build at the time of db initialization. channel_service using mongo atlas.
e.g:
  - docker exec -it <db-container-id> /bin/sh
  - psql -U postgres
  - CREATE DATABASE your_admin_service_db_name;
  - CREATE DATABASE your_course_service_db_name;
"""

docker-compose up -d

# Install frontend dependencies
cd ../client

# setup .env file as mentioned below.
npm install

# Start the React development server
npm run dev
```

---

## 🔧 Environment Configuration

### Backend (.env)
```env
# Common Configurations
DB_NAME=learnerds_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DEBUG=True
EMAIL_HOST_USER=your_email_user
EMAIL_HOST_PASSWORD_USER=your_host_password
REDIS_HOST=redis
REDIS_PORT=your_redis_port
RABBITMQ_HOST=rabbitmq
RABBITMQ_USER=your_rabbitmq_user_name
RABBITMQ_PASS=your_rabbitmq_password

# user_service
DB_NAME_USER=your_user_service_db_name
DJANGO_SECRET_USER=your_user_service_django_secret_key
JWT_SECRET_KEY=your_jwt_secret
JWT_ALGORITHM_USER=your_jwt_algorithm
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_firebase_private_key_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_CLIENT_ID=your_firebase_client_id
FIREBASE_AUTH_URI=your_firebase_auth_uri
FIREBASE_TOKEN_URI=your_firebase_token_uri
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=your_firebase_auth_provider_cert_url
FIREBASE_CLIENT_X509_CERT_URL=your_firebase_client_cert_url
FIREBASE_UNIVERSE_DOMAIN=your_firebase_universe_domain

# admin_service
DB_NAME_ADMIN=your_admin_service_db_name
DJANGO_SECRET_ADMIN=your_admin_service_django_secret_key
CLOUDINARY_CLOUD_NAME=ddlw92hp6
CLOUDINARY_API_KEY=137559726597386
CLOUDINARY_API_SECRET=coKxqU9Z3OD4r8QipUQDV4mzCRM

# course_service
DB_NAME_COURSE=your_course_service_db_name
DJANGO_SECRET_COURSE=your_course_service_django_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
ZEGO_APP_ID=your_zegocloud_app_id
ZEGO_SERVER_SECRET=your_zegocloud_server_secret

# channel_service
DJANGO_SECRET_CHANNEL=your_channel_service_django_secret_key
MONGODB_DATABASENAME=your_mongodb_db_name
MONGODB_URI=your_mongodb_atlas_uri
MONGODB_USERNAME=your_mongo_atlas_user_name
MONGODB_PASSWORD=your_mongodb_atlas_collection_password

# api_gateway_service-django
DJANGO_SECRET_GATEWAY=your_api_gateway_django_secret_key
USER_SERVICE_URL=http://host.docker.internal:8001/
ADMIN_SERVICE_URL=http://host.docker.internal:8002/
COURSE_SERVICE_URL=http://host.docker.internal:8003/
CHANNEL_SERVICE_URL=http://host.docker.internal:8004/

```

### Frontend (.env)
```env
# API Configuration
VITE_BASE_URL=http://localhost:8000/
VITE_WS_BASE_URL=ws://localhost:8004
VITE_BASE_PATH=/

# Payment Gateway
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Claudinary Config
VITE_UPLOAD_PRESET=chat_media
VITE_CLOUD_NAME=ddlw92hp6
VITE_CLOUDINARY_IMAGE_UPLOAD_URL=https://api.cloudinary.com/v1_1/ddlw92hp6/image/upload
```

---

### API Testing
- **Postman Collection**: Available in `/docs/api-collection.json` (will publish later)
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

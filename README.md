# MeddiConnect

A comprehensive healthcare platform that connects patients with healthcare providers, facilitating seamless healthcare interactions, appointments, and medical record management.

## 🏥 Overview

MeddiConnect is a full-stack healthcare management system that enables:
- **Patients** to find doctors, book appointments, manage medical records, and interact with healthcare providers
- **Doctors** to manage schedules, appointments, patients, and share medical insights
- **Administrators** to oversee the platform, manage users, and moderate content

## ✨ Key Features

### For Patients
- 🔐 Secure authentication and profile management
- 🔍 Advanced doctor search with filters (specialty, location, insurance, ratings)
- 📅 Online and in-person appointment booking
- 💬 Real-time chat with doctors
- 📹 Video consultations via ZegoCloud integration
- 📋 Medical records and prescription management
- 🤖 AI-powered patient assistant for doctor recommendations
- 📱 Social feed to view medical posts from doctors
- ⭐ Rate and review healthcare providers
- 🔔 Appointment notifications and reminders
- 📊 Activity tracking and privacy settings

### For Doctors
- 👨‍⚕️ Professional profile management with specialties and credentials
- 📅 Schedule management and availability settings
- 📝 Patient management and medical records
- 💬 Real-time chat with patients
- 📹 Video consultation capabilities
- 📊 Analytics dashboard for practice insights
- 📱 Social media features to share medical insights
- ⭐ Patient feedback and reviews management
- 📋 Prescription management
- 🔔 Appointment notifications

### For Administrators
- 👥 User management (patients and doctors)
- ✅ Doctor approval system
- 📝 Content moderation for medical posts
- 📊 Platform analytics and oversight
- 🔒 Account status management

## 🛠️ Tech Stack

### Frontend (`meddiconnect/`)
- **Framework**: React 19 with TypeScript
- **UI Library**: Material-UI (MUI) v6
- **Routing**: React Router v7
- **State Management**: React Context API
- **Form Handling**: Formik & Yup
- **Styling**: Styled Components, Emotion
- **Maps**: Google Maps API
- **Real-time Communication**: 
  - WebSocket (STOMP.js) for chat
  - ZegoCloud for video calls
- **Charts**: Recharts
- **Build Tool**: Create React App

### Backend (`MediConnect/`)
- **Framework**: Spring Boot 3.5.3
- **Language**: Java 17
- **Security**: Spring Security with JWT authentication
- **Database**: 
  - PostgreSQL (primary database)
  - Redis (caching and session management)
- **ORM**: Spring Data JPA / Hibernate
- **WebSocket**: Spring WebSocket for real-time features
- **File Storage**: Cloudinary (images and videos)
- **Email**: Spring Mail (SMTP)
- **AI Integration**: OpenAI API (GPT-4o-mini)
- **Build Tool**: Maven
- **Additional Libraries**:
  - MapStruct (DTO mapping)
  - Lombok (boilerplate reduction)
  - Flyway (database migrations)

## 📁 Project Structure

```
meddiconnect/
├── meddiconnect/              # Frontend React Application
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── admin/        # Admin-specific components
│   │   │   ├── DoctorLayout.tsx
│   │   │   ├── PatientLayout.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── ...
│   │   ├── pages/            # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── PatientDashboard.tsx
│   │   │   ├── DoctorDashboard.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── ...
│   │   ├── context/          # React Context providers
│   │   │   ├── AuthContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/            # Custom React hooks
│   │   │   ├── useWebSocketChat.ts
│   │   │   └── useWebSocketVideo.ts
│   │   ├── config/           # Configuration files
│   │   │   └── zegoConfig.ts
│   │   ├── types/            # TypeScript type definitions
│   │   └── constants/        # Constants and enums
│   ├── package.json
│   └── tsconfig.json
│
├── MediConnect/              # Backend Spring Boot Application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/MediConnect/
│   │   │   │   ├── EntryRelated/    # Core business logic
│   │   │   │   │   ├── controller/ # REST controllers
│   │   │   │   │   ├── service/     # Business services
│   │   │   │   │   ├── repository/  # Data access layer
│   │   │   │   │   ├── entities/    # JPA entities
│   │   │   │   │   └── dto/         # Data transfer objects
│   │   │   │   ├── socialmedia/     # Social features
│   │   │   │   ├── ai/              # AI integration
│   │   │   │   ├── config/          # Configuration classes
│   │   │   │   └── filter/          # Security filters
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       └── db/migration/    # Flyway migrations
│   │   └── test/             # Test files
│   ├── pom.xml
│   └── compose.yaml          # Docker Compose configuration
│
└── README.md                 # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher) and npm
- **Java** 17 or higher
- **Maven** 3.6+
- **PostgreSQL** 12+
- **Redis** 6+
- **Git**

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd meddiconnect
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (if needed) with environment variables:
   ```env
   REACT_APP_API_URL=http://localhost:8080
   REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   REACT_APP_ZEGO_APP_ID=your-zego-app-id
   REACT_APP_ZEGO_SERVER_SECRET=your-zego-server-secret
   ```

4. Start the development server:
   ```bash
   npm start
   ```

   The frontend will be available at `http://localhost:3000`

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd MediConnect
   ```

2. Set up PostgreSQL database:
   ```sql
   CREATE DATABASE Meddiconnect;
   ```

3. Update `src/main/resources/application.properties` with your configuration:
   ```properties
   # Database
   spring.datasource.url=jdbc:postgresql://localhost:5432/Meddiconnect
   spring.datasource.username=your-username
   spring.datasource.password=your-password
   
   # Redis
   spring.data.redis.host=localhost
   spring.data.redis.port=6379
   
   # Cloudinary (for file uploads)
   cloudinary.cloud-name=your-cloud-name
   cloudinary.api-key=your-api-key
   cloudinary.api-secret=your-api-secret
   
   # OpenAI (for AI features)
   openai.api-key=${OPENAI_API_KEY}
   openai.model=gpt-4o-mini
   
   # Email (SMTP)
   spring.mail.host=smtp.gmail.com
   spring.mail.port=587
   spring.mail.username=your-email@gmail.com
   spring.mail.password=your-app-password
   ```

4. Start Redis server:
   ```bash
   redis-server
   ```

5. Build and run the application:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

   The backend API will be available at `http://localhost:8080`

### Using Docker Compose

The backend includes a `compose.yaml` file for easy setup of PostgreSQL and Redis:

```bash
cd MediConnect
docker-compose up -d
```

## 🔧 Configuration

### Environment Variables

#### Frontend
- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_GOOGLE_MAPS_API_KEY`: Google Maps API key
- `REACT_APP_ZEGO_APP_ID`: ZegoCloud application ID
- `REACT_APP_ZEGO_SERVER_SECRET`: ZegoCloud server secret

#### Backend
- `OPENAI_API_KEY`: OpenAI API key for AI features
- Database credentials (configured in `application.properties`)
- Cloudinary credentials (configured in `application.properties`)
- Email SMTP settings (configured in `application.properties`)

### Default Admin Account

The system creates a default admin account on startup:
- **Username**: `admin`
- **Password**: `Admin@123`
- **Email**: `admin@meddiconnect.com`

⚠️ **Important**: Change these credentials in production!

## 📡 API Endpoints

### Authentication
- `POST /api/auth/patient/login` - Patient login
- `POST /api/auth/patient/signup` - Patient registration
- `POST /api/auth/health-provider/login` - Doctor login
- `POST /api/auth/health-provider/signup` - Doctor registration
- `POST /api/auth/admin/login` - Admin login

### Appointments
- `GET /api/appointments` - Get appointments
- `POST /api/appointments/book` - Book appointment
- `PUT /api/appointments/{id}` - Update appointment
- `DELETE /api/appointments/{id}` - Cancel appointment

### Doctors
- `GET /api/health-providers` - Get all doctors
- `GET /api/health-providers/{id}` - Get doctor details
- `GET /api/health-providers/search` - Search doctors

### Patients
- `GET /api/patients/{id}` - Get patient profile
- `PUT /api/patients/{id}` - Update patient profile

### Social Media
- `GET /api/posts` - Get medical posts
- `POST /api/posts` - Create post
- `POST /api/posts/{id}/like` - Like post
- `POST /api/posts/{id}/comment` - Comment on post

### Chat
- WebSocket endpoint: `/ws/chat`
- `GET /api/chat/channels` - Get chat channels
- `POST /api/chat/messages` - Send message

### Video Calls
- WebSocket endpoint: `/ws/video`

## 🧪 Testing

### Frontend Tests
```bash
cd meddiconnect
npm test
```

### Backend Tests
```bash
cd MediConnect
mvn test
```

## 🏗️ Building for Production

### Frontend
```bash
cd meddiconnect
npm run build
```

The production build will be in the `build/` directory.

### Backend
```bash
cd MediConnect
mvn clean package
```

The JAR file will be in the `target/` directory.

## 🔒 Security Features

- JWT-based authentication
- Password encryption
- Role-based access control (Patient, Doctor, Admin)
- CORS configuration
- Input validation
- SQL injection prevention (JPA)
- XSS protection

## 📝 Database Migrations

The project uses Flyway for database migrations. Migration scripts are located in:
```
MediConnect/src/main/resources/db/migration/
```

Migrations run automatically on application startup.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **Abdulrahman Alsnour** - Initial work

## 🙏 Acknowledgments

- Material-UI for the component library
- Spring Boot team for the excellent framework
- ZegoCloud for video call infrastructure
- Cloudinary for media storage
- OpenAI for AI capabilities

## 📞 Support

For support, please open an issue in the GitHub repository.

---

**Note**: This is a development project. Ensure all sensitive credentials are properly configured and never committed to version control.


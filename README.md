# Sadaora Starter App - Member Profiles + Feed

A full-stack social media application featuring user profiles, authentication, and a public feed.

## 🚀 Tech Stack

- **Frontend**: React.js with Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based session management
- **File Upload**: AWS S3 (for profile images)
- **Deployment**: Ready for Vercel/Netlify frontend + Railway/Heroku backend

## 🏗️ Project Structure

```
├── backend/          # Node.js + Express API
│   ├── prisma/       # Database schema & migrations
│   ├── src/          # Application source code
│   └── uploads/      # Local file storage (dev only)
├── frontend/         # React.js + Vite application
│   ├── src/          # Components, pages, hooks
│   └── public/       # Static assets
└── README.md
```

## 📋 Features

### Core Features
- ✅ **Authentication**: Sign up/login with JWT
- ✅ **Profile Management**: Full CRUD operations
- ✅ **Public Feed**: View all user profiles with pagination
- ✅ **Responsive Design**: Mobile-first approach

### Bonus Features
- ✅ **Image Upload**: AWS S3 integration for profile photos
- ✅ **Social Features**: Follow/unfollow users, like profiles
- ✅ **Advanced Filtering**: Filter feed by interests/tags
- ✅ **Deploy Ready**: Production-ready configuration

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- AWS account (for S3 image upload)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database and AWS credentials
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API endpoints
npm run dev
```

### Database Setup
```bash
# Create PostgreSQL database
createdb sadaora_dev

# Run migrations
cd backend
npx prisma migrate dev --name init
```

## 🔧 Environment Variables

### Backend (.env)
```
DATABASE_URL="postgresql://username:password@localhost:5432/sadaora_dev"
JWT_SECRET="your-super-secret-jwt-key"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-s3-bucket-name"
PORT=3001
```

### Frontend (.env)
```
VITE_API_URL="http://localhost:3001/api"
```

## 🏛️ Architectural Decisions

### Backend Architecture
I chose **Express.js with Prisma** for the backend to balance simplicity with scalability. Prisma provides excellent TypeScript support and makes database operations more maintainable than raw SQL, while still offering the flexibility of custom queries when needed.

The API follows **RESTful conventions** with clear resource-based endpoints (`/users`, `/profiles`, `/feed`). JWT authentication is stateless and scalable, with refresh token rotation for enhanced security.

### Frontend Architecture
**Vite + React** provides a fast development experience with excellent hot module replacement. The frontend uses a **component-based architecture** with custom hooks for state management and API calls.

I implemented **optimistic updates** for better UX (likes/follows update immediately) and **infinite scrolling** for the feed to handle large datasets efficiently.

### Database Design
The schema supports the core features while being extensible:
- **Users** table for authentication
- **Profiles** table for user information
- **Follows** table for social relationships
- **Likes** table for profile interactions
- **Interest tags** stored as JSON for flexibility

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Heroku)
```bash
cd backend
# Configure your deployment platform
# Set environment variables
# Deploy with PostgreSQL addon
```

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token expiration and refresh
- Input validation and sanitization
- SQL injection prevention via Prisma
- CORS configuration
- Rate limiting on auth endpoints

## 📱 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token

### Profiles
- `GET /api/profiles/me` - Get current user profile
- `PUT /api/profiles/me` - Update current user profile
- `DELETE /api/profiles/me` - Delete current user profile
- `POST /api/profiles/upload` - Upload profile image

### Feed
- `GET /api/feed` - Get public feed with pagination
- `GET /api/feed/:userId` - Get specific user profile
- `POST /api/feed/:userId/like` - Like a profile
- `POST /api/feed/:userId/follow` - Follow a user

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🔄 Development Workflow

1. **Database changes**: Update Prisma schema → `npx prisma migrate dev`
2. **API changes**: Update Express routes → Update frontend API calls
3. **Frontend changes**: Component updates → Test in browser
4. **Full stack testing**: Test authentication flow end-to-end

## 🎯 Future Enhancements

- Real-time notifications (WebSocket)
- Advanced search and filtering
- Direct messaging
- Content moderation
- Analytics dashboard
- Mobile app (React Native)

## 👥 Contact

For questions about this assessment, please reach out to the Sadaora team.
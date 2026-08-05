# Trishul CRM - Advanced Customer Relationship Management System

A production-ready, full-stack CRM application with cinematic animations, role-based access control, and AI-powered assistance.

## 🚀 Features

### Core Functionality
- **Authentication & Security**: JWT-based authentication with bcrypt password hashing
- **Role-Based Access Control (RBAC)**: Admin, Supervisor, and User roles with specific permissions
- **Customer Management**: Full CRUD operations with search, filtering, and pagination
- **Lead Management**: Pipeline tracking (New → Contacted → Interested → Won/Lost)
- **Task Management**: Priority-based task assignment with due date tracking
- **Employee Management**: Admin-only employee management with supervisor assignment
- **Reports & Analytics**: Dashboard statistics, top performers, inactive customers
- **AI Assistant**: Admin-only intelligent chat interface for quick insights
- **Settings**: Profile management, password change, and theme toggle

### UI/UX Features
- **Cinematic Intro Animation**: 3D Trishul model with Three.js/GSAP effects
- **Smooth Animations**: Framer Motion for page transitions, hover effects, and counters
- **Modern Dark Theme**: Sleek dark-tech design with glass morphism effects
- **Responsive Design**: Optimized for Desktop, Tablet, and Mobile
- **Interactive Charts**: Real-time data visualization with Recharts

## 📋 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - RESTful API framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **cors** - Cross-origin resource sharing
- **helmet** - Security headers

### Frontend
- **Next.js 14** - React framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Three.js** - 3D graphics
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Three.js helpers
- **GSAP** - Animation library
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **Axios** - HTTP client

## 📁 Project Structure

```
Trishul/
├── backend/
│   ├── controllers/        # Route controllers
│   │   ├── authController.js
│   │   ├── customerController.js
│   │   ├── leadController.js
│   │   ├── taskController.js
│   │   ├── employeeController.js
│   │   ├── reportController.js
│   │   ├── settingController.js
│   │   └── aiController.js
│   ├── middleware/         # Custom middleware
│   │   └── auth.js
│   ├── models/            # Mongoose models
│   │   ├── User.js
│   │   ├── Customer.js
│   │   ├── Lead.js
│   │   ├── Task.js
│   │   └── Setting.js
│   ├── routes/            # API routes
│   │   ├── auth.js
│   │   ├── customers.js
│   │   ├── leads.js
│   │   ├── tasks.js
│   │   ├── employees.js
│   │   ├── reports.js
│   │   ├── settings.js
│   │   └── ai.js
│   ├── .env               # Environment variables
│   ├── .env.example       # Environment template
│   ├── package.json       # Backend dependencies
│   └── server.js          # Entry point
├── frontend/
│   ├── app/               # Next.js app directory
│   │   ├── dashboard/     # Dashboard pages
│   │   │   ├── customers/
│   │   │   ├── leads/
│   │   │   ├── tasks/
│   │   │   ├── employees/
│   │   │   ├── reports/
│   │   │   ├── ai/
│   │   │   ├── settings/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/        # React components
│   │   ├── CinematicIntro.tsx
│   │   ├── Login.tsx
│   │   ├── Sidebar.tsx
│   │   └── DashboardLayout.tsx
│   ├── lib/              # Utility libraries
│   │   ├── axios.ts
│   │   └── utils.ts
│   ├── .env.local        # Frontend environment variables
│   ├── package.json      # Frontend dependencies
│   ├── next.config.js     # Next.js configuration
│   ├── tailwind.config.ts # Tailwind configuration
│   ├── tsconfig.json      # TypeScript configuration
│   └── postcss.config.js # PostCSS configuration
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Trishul
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Configure environment variables in `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/trishul_crm
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
NODE_ENV=development
```

Start the backend server:
```bash
npm run dev
# or
npm start
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Configure environment variables in `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 🔐 Default Admin Account

After starting the application, you'll need to create an admin account. You can do this by:

1. Using the registration endpoint directly:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@trishul.com",
    "password": "admin123",
    "role": "Admin"
  }'
```

2. Or create a script to seed the database with initial users.

## 📱 Usage Guide

### First Launch
1. Open `http://localhost:3000` in your browser
2. Watch the cinematic intro animation (plays once)
3. Login with your credentials
4. Access the dashboard based on your role

### Role Permissions

**Admin:**
- Full system access
- Employee management
- AI Assistant access
- Reports and analytics
- Global settings

**Supervisor:**
- Manage assigned users
- View team performance
- Assign leads
- View reports

**User:**
- Manage assigned leads
- Update customer status
- Complete daily tasks
- View personal dashboard

### Key Features

**Dashboard:**
- Real-time statistics counters
- Monthly leads and customer growth charts
- Recent activity feed
- Quick-action widgets

**Customers Module:**
- Add, edit, delete customers
- Search by name, company, or email
- Filter by status (Active, Inactive, Pending)
- Pagination support

**Leads Module:**
- Track lead status through pipeline
- Assign leads to team members
- Set estimated values and follow-up dates
- Source tracking (Website, Referral, Advertisement, etc.)

**Tasks Module:**
- Create and assign tasks
- Set priority levels (Low, Medium, High)
- Track due dates with overdue indicators
- Toggle completion status

**AI Assistant (Admin Only):**
- "Summarize today's activity"
- "Generate a follow-up email"
- "Write a customer proposal"
- "List inactive customers"
- "Show the top-performing employee"

## 🚀 Deployment

### Backend Deployment (e.g., Vercel, Railway, Render)

1. Set environment variables in your hosting platform
2. Deploy the backend code
3. Ensure MongoDB is accessible (use MongoDB Atlas for cloud)

### Frontend Deployment (Vercel)

```bash
cd frontend
npm run build
vercel deploy
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Environment Variables for Production

**Backend:**
```env
PORT=5000
MONGODB_URI=<your-production-mongodb-uri>
JWT_SECRET=<strong-random-secret>
NODE_ENV=production
```

**Frontend:**
```env
NEXT_PUBLIC_API_URL=<your-production-api-url>
```

## 🧪 Testing

### API Testing
Use Postman or cURL to test API endpoints:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@trishul.com", "password": "admin123"}'

# Get Customers (requires token)
curl -X GET http://localhost:5000/api/customers \
  -H "Authorization: Bearer <your-jwt-token>"
```

## 🔧 Troubleshooting

### Common Issues

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check MONGODB_URI in .env file
- Verify MongoDB credentials

**CORS Errors:**
- Check that backend CORS is configured correctly
- Verify NEXT_PUBLIC_API_URL in frontend

**Animation Not Playing:**
- Clear browser localStorage (key: 'hasSeenIntro')
- Check browser console for Three.js errors

**Authentication Issues:**
- Verify JWT_SECRET is set
- Check token expiration (default: 30 days)
- Ensure bcrypt is hashing passwords correctly

## 📊 Database Schema

### User Collection
- name (String, Required)
- email (String, Required, Unique)
- password (String, Required, Hashed)
- role (Enum: Admin, Supervisor, User)
- supervisorId (ObjectId, Optional)
- createdAt (Timestamp)

### Customer Collection
- name (String, Required)
- company (String)
- phone (String)
- email (String)
- address (String)
- status (Enum: Active, Inactive, Pending)
- notes (String)
- createdBy (ObjectId)
- createdAt (Timestamp)

### Lead Collection
- leadName (String, Required)
- phone (String)
- email (String)
- source (String)
- status (Enum: New, Contacted, Interested, Won, Lost)
- assignedUser (ObjectId)
- estimatedValue (Number)
- followUpDate (Date)
- createdAt (Timestamp)

### Task Collection
- title (String, Required)
- description (String)
- assignedTo (ObjectId, Required)
- dueDate (Date, Required)
- priority (Enum: Low, Medium, High)
- status (Enum: Pending, Completed)
- createdAt (Timestamp)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Support

For support, email support@trishulcrm.com or open an issue in the repository.

## 🎯 Future Enhancements

- Email notifications for task reminders
- File attachments for customers and leads
- Advanced reporting with custom date ranges
- Integration with third-party services (Gmail, Calendar)
- Mobile app (React Native)
- Real-time updates with WebSockets
- Advanced AI features with actual NLP integration

---

Built with ❤️ using modern web technologies

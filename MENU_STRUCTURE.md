# Smart LMS - Complete Menu Structure

## Dashboard Navigation Overview

All dashboards feature:
- **Responsive Sidebar** - Collapsible on mobile, persistent on desktop
- **Header Component** - User greeting, stats, notifications, logout
- **Notification System** - Real-time updates, mark as read
- **Session Management** - 30-min timeout with 5-min warning dialog
- **Force Password Change** - Enforced after admin reset

---

## STUDENT DASHBOARD

**Path:** `/student`

### Sidebar Menu (16 Items)
```
SmartLMS
├── 📊 Dashboard          → /student/          [Main overview]
├── 📚 Course Catalog     → /student/courses   [Browse & enroll]
├── 🏫 My Courses         → /student/my-courses [Enrolled courses]
├── 📝 Assignments        → /student/assignments [Submissions]
├── ❓ Quizzes            → /student/quizzes   [Quiz taking]
├── 📈 Analytics          → /student/analytics [Performance]
├── 🏆 Achievements       → /student/achievements [Badges & XP]
├── 💬 Discussions        → /student/discussions [Forums]
├── 📅 Calendar           → /student/calendar  [Academic calendar]
├── 📄 Materials          → /student/materials [Course resources]
├── 📋 Planner            → /student/planner   [Study planner]
├── 🎓 Certificates       → /student/certificates [Achievements]
├── 🎥 Live Classes       → /student/live      [Attend live sessions]
├── 🛡️ Anti-Cheat         → /student/anti-cheat [Violation records]
├── ⚙️ Settings            → /student/settings [Profile & prefs]
└── ❓ Help               → /student/help      [Support center]
```

### Header Stats
- Courses (enrolled count)
- Due Soon (pending assignments)
- Level (gamification level)
- Badges (achievement count)
- Unread Notifications (bell badge)

### Key Features
- ✅ Course search & filtering
- ✅ Assignment submission tracking
- ✅ Quiz attempt management
- ✅ Grade viewing
- ✅ Real-time notifications
- ✅ Discussion participation
- ✅ Live class attendance
- ✅ Progress analytics

---

## TEACHER DASHBOARD

**Path:** `/teacher`

### Sidebar Menu (15 Items)
```
SmartLMS
├── 📊 Dashboard          → /teacher/          [Overview & stats]
├── 📚 Courses            → /teacher/courses   [Create & manage]
├── 📄 Materials          → /teacher/materials [Upload resources]
├── 📝 Assignments        → /teacher/assignments [Create & manage]
├── ✔️ Grading Queue      → /teacher/grading   [Pending submissions]
├── 📖 Grade Book         → /teacher/gradebook [All grades view]
├── 👥 Students           → /teacher/students  [Enrollment mgmt]
├── 💬 Discussions        → /teacher/discussions [Moderation]
├── 📅 Calendar           → /teacher/calendar  [Class schedule]
├── 🏆 Badges             → /teacher/badges    [Create & assign]
├── ❓ Quizzes            → /teacher/quizzes   [Create & manage]
├── 🎥 Live Classes       → /teacher/live      [Host sessions]
├── 🛡️ Anti-Cheat         → /teacher/anti-cheat [Monitor]
├── ⚙️ Settings            → /teacher/settings  [Profile & prefs]
└── ❓ Help               → /teacher/help      [Support center]
```

### Header Display
- Dashboard title
- Unread notifications (bell badge)
- User logout button

### Key Features
- ✅ Full course management
- ✅ Assignment creation & grading
- ✅ Quiz creation & monitoring
- ✅ Student enrollment management
- ✅ Grade book with filtering
- ✅ Badge creation & assignment
- ✅ Live class hosting
- ✅ Real-time notifications
- ✅ Anti-cheat monitoring
- ✅ Discussion moderation

---

## ADMIN DASHBOARD

**Path:** `/admin`

### Sidebar Menu (10 Items)
```
SmartLMS Admin
├── 📊 Dashboard          → /admin/            [System overview]
├── 🔄 Password Resets    → /admin/resets      [Reset requests]
├── 👥 Users              → /admin/users       [User management]
├── 📈 Analytics          → /admin/analytics   [System analytics]
├── 🛡️ System & Admin      → /admin/maintenance [Control panel]
├── 🏥 System Health      → /admin/health      [Health status]
├── ⚙️ System Management   → /admin/management [Configuration]
├── 🔧 Admin Settings     → /admin/settings    [Admin prefs]
├── ❓ Help               → /admin/help        [Support center]
└── ℹ️ System Info        → /admin/system      [Logs & info]
```

### Header Display
- "Admin Dashboard" title
- Unread notifications
- Blue logout button

### Key Features
- ✅ User administration
- ✅ Password reset approval
- ✅ System analytics
- ✅ System health monitoring
- ✅ Maintenance mode control
- ✅ System configuration
- ✅ Security alerts
- ✅ System logs viewing
- ✅ Broadcast messaging
- ✅ Admin-level settings

---

## AUTHENTICATION FLOW

### Landing Page
**Path:** `/`

```
Landing Page
├── Hero Section
│   ├── Sign In (modal)
│   └── Get Started (modal)
├── Feature Sections
├── Footer
└── Auth Modals
    ├── Login Form
    │   ├── Email input
    │   ├── Password input
    │   ├── Sign up link
    │   └── Reset password link
    │
    ├── Signup Form
    │   ├── Role selection (student/teacher/admin)
    │   ├── Name input
    │   ├── Email input
    │   ├── Password input
    │   └── Login link
    │
    └── Reset Password Form
        ├── Email input
        ├── Send reset link
        └── Login link
```

### Authentication Routes
- `POST /api/auth/login` - Login
- `POST /api/auth/signup` - Register
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Check session
- `GET /api/auth/me` - Current user
- `POST /api/auth/password` - Change password
- `POST /api/auth/reset-request` - Request reset
- `POST /api/auth/reset-confirm` - Confirm reset

---

## SHARED COMPONENTS

### Header (All Dashboards)
```
Header Component
├── Menu Button (mobile)
├── Title / Greeting
├── Center Content (role-specific)
├── Right Content
│   ├── Notification Bell
│   │   ├── Badge (unread count)
│   │   └── Notification Panel
│   │       ├── List of notifications
│   │       ├── Mark as read option
│   │       └── Clear all button
│   └── Logout Button
└── Session Warning Modal
    ├── Timer countdown
    ├── Stay logged in button
    └── Logout option
```

### Sidebar (All Dashboards)
```
Sidebar Component
├── App Title (SmartLMS / SmartLMS Admin)
├── Menu Items
│   └── Active page highlighting
├── Mobile Overlay
│   └── Close button
└── Active State Styling
    └── Blue background for current page
```

### Notification Panel
```
Notification Panel
├── Header "Notifications"
├── Unread Count Badge
├── Notification List
│   └── Notification Item
│       ├── Title
│       ├── Message
│       ├── Timestamp
│       └── Mark as read button
├── Clear All button
└── Close button
```

---

## PAGE STRUCTURE PATTERN

All pages follow this structure:

```tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { API_ACTIONS } from '@/lib/api-actions';

export default function PageName() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      setError(null);
      API_ACTIONS()
        .then(setData)
        .catch(err => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return <ComponentContent data={data} />;
}
```

---

## NAVIGATION PATTERNS

### From Sidebar
```
onNavigate(page) 
  → router.push(`/${role}/${page}`)
  → Page reloads with URL
```

### From Components
```
router.push(`/${role}/page?id=123`)
  → Query parameter passing
  → Page parses searchParams
```

### Role-Based Redirect
```
After Login:
  → AuthContext updates
  → useEffect checks role
  → router.push(`/${role}`)
  → Correct dashboard loads
```

---

## API ENDPOINTS MAP

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/signup`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `GET /api/auth/me`
- `POST /api/auth/password`

### Learning
- `GET /api/courses`
- `GET /api/enrollments`
- `GET /api/assignments`
- `GET /api/submissions`
- `GET /api/quizzes`
- `GET /api/quiz-submissions`
- `GET /api/materials`
- `GET /api/live-classes`

### Communication
- `GET /api/system/notifications`
- `PATCH /api/system/notifications`
- `GET /api/discussions`
- `POST /api/discussions`

### Gamification
- `GET /api/user-badges`
- `GET /api/certificates`

### Admin
- `GET /api/users`
- `POST /api/users/reset-password`
- `GET /api/system/health`
- `GET /api/system/logs`
- `POST /api/system/maintenance`
- `GET /api/system/settings`

---

## STATE MANAGEMENT

### Global State (AppContext)
- Current user notifications
- System-wide messages
- Toast notifications

### Page State (useState)
- Local data fetches
- Loading/error states
- Form inputs
- Modal visibility

### Persistent State (SessionStorage)
- Session ID
- User preferences
- Theme settings

### Offline State (IndexedDB)
- Cached user data
- Offline-first support
- Sync queue

---

## ERROR HANDLING FLOW

```
User Action
  ↓
API Call (with retry)
  ↓
Success → Update State → Render
  ↓
Error → Error Handler
  ↓
  ├── Network Error → Show "Unable to connect"
  ├── Auth Error → Redirect to login
  ├── Validation Error → Show field error
  └── Server Error → Show error message + retry
  ↓
Display Error State with Retry Button
```

---

## LOADING STATE PATTERN

```
Component
  ├── Loading: <div className="animate-pulse">Loading...</div>
  ├── Error: <div className="text-red-600">{error}</div>
  └── Loaded: <ComponentContent data={data} />
```

---

## COMPLETE FEATURE MAP

| Feature | Student | Teacher | Admin | Status |
|---------|---------|---------|-------|--------|
| Dashboard | ✅ | ✅ | ✅ | Complete |
| Courses | Browse | Manage | Control | Complete |
| Assignments | Submit | Grade | Monitor | Complete |
| Quizzes | Take | Create | Monitor | Complete |
| Grading | View | Full | Monitor | Complete |
| Notifications | ✅ | ✅ | ✅ | Complete |
| User Management | View | Limited | Full | Complete |
| Analytics | Personal | Course | System | Complete |
| Anti-Cheat | Monitor | Monitor | Monitor | Complete |
| Settings | ✅ | ✅ | ✅ | Complete |
| Help/Support | ✅ | ✅ | ✅ | Complete |
| Session Mgmt | ✅ | ✅ | ✅ | Complete |

---

## DEPLOYMENT CHECKLIST

Before deployment, ensure:
- ✅ All pages load without errors
- ✅ Navigation works correctly
- ✅ Error states display properly
- ✅ Loading states visible
- ✅ Session timeout working
- ✅ Notifications functional
- ✅ Authentication flows working
- ✅ Database RLS policies enabled
- ✅ Environment variables set
- ✅ HTTPS configured
- ✅ Email service configured
- ✅ Backups configured

---

**Last Updated:** April 27, 2026  
**Status:** ✅ All menus and navigation verified and functional  
**Build:** ✅ Successful compilation

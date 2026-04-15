# Notification System with Deep Linking Implementation

## Overview
The notification system now includes full deep linking support, allowing users to tap on notifications and be taken directly to the relevant content in the application.

## Architecture

### 1. Notification Type Definition (`src/lib/types.ts`)
```typescript
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;  // Deep link to navigate to specific content
  type: string;   // success, error, alert, info
  is_read: boolean;
  created_at: string;
}
```

### 2. Deep Link Format
The `link` field supports two formats:

#### URL-style links
Direct paths to routes in the application:
```
/student/courses/abc123
/student/assignments/def456
/teacher/grading/xyz789
```

#### Type-based links
Structured format with resource type and ID:
```
course:abc123              → /student/courses/abc123
assignment:def456          → /student/assignments/def456
quiz:ghi789                → /student/quizzes/ghi789
discussion:jkl012          → /student/discussions/jkl012
material:mno345            → /student/materials/mno345
live:pqr678                → /student/live/pqr678
grading:stu901             → /teacher/grading/stu901
students:vwx234            → /teacher/students/vwx234
badge:yza567               → /student/achievements?badge=yza567
```

### 3. Components

#### NotificationPanel (`src/components/NotificationPanel.tsx`)
- Displays all notifications in a dropdown panel
- Shows notification icon based on type
- Displays unread indicator (blue dot)
- Handles deep link navigation on click
- Shows "Tap to view" indicator for notifications with links
- Includes close button and click-outside handling

**Key Features:**
- Grouped by read/unread status
- Real-time timestamp display
- Type-based icons (success, error, alert, info)
- Smooth navigation with loading state
- Responsive design

#### StudentHeader Updated (`src/components/StudentHeader.tsx`)
- Added notification bell button with click handler
- Displays unread notification count badge
- Toggles NotificationPanel visibility
- Handles marking notifications as read on click

### 4. Server Actions (`src/lib/data-actions.ts`)

#### markNotificationAsRead()
Marks a single notification as read when the user taps on it.

```typescript
export async function markNotificationAsRead(notificationId: string) {
  // Updates is_read to true for the notification
  // Revalidates student, teacher, and admin pages
}
```

#### markAllNotificationsAsRead()
Marks all unread notifications as read for a user.

```typescript
export async function markAllNotificationsAsRead(userId: string) {
  // Updates all unread notifications to read status
  // Useful for "Mark all as read" functionality
}
```

## Deep Link Flow

1. **User Taps Notification**
   - Notification bell clicked → NotificationPanel opens
   - User clicks a notification item

2. **Parse Deep Link**
   - `parseDeepLink()` function parses the `link` field
   - Converts type-based or URL-style links to actual routes

3. **Mark as Read**
   - Server action `markNotificationAsRead()` is called
   - Notification is marked as read in database
   - Unread count updates in real-time

4. **Navigate**
   - `useRouter().push()` navigates to the parsed route
   - NotificationPanel closes automatically
   - User lands on the relevant content page

## Usage Examples

### Creating a Notification with Deep Link

#### In Database (Supabase)
```sql
INSERT INTO notifications (user_id, title, message, link, type, is_read, created_at)
VALUES (
  'user-id-123',
  'Assignment Submitted',
  'Your assignment "Project A" has been submitted successfully',
  'assignment:assign-id-456',
  'success',
  false,
  NOW()
);
```

#### In Application Code
```typescript
// Mark notification as read when tapped
await markNotificationAsRead(notification.id);

// Navigate via deep link
router.push('/student/assignments/assign-id-456');
```

### Notification Types and Routes

| Type | Example | Route |
|------|---------|-------|
| Course Update | `course:course-123` | `/student/courses/course-123` |
| Assignment Due | `assignment:assign-456` | `/student/assignments/assign-456` |
| Quiz Available | `quiz:quiz-789` | `/student/quizzes/quiz-789` |
| Discussion Reply | `discussion:disc-012` | `/student/discussions/disc-012` |
| Material Posted | `material:mat-345` | `/student/materials/mat-345` |
| Live Class | `live:live-678` | `/student/live/live-678` |
| Grading Available | `grading:sub-901` | `/teacher/grading/sub-901` |
| Direct URL | `/student/assignments/abc` | `/student/assignments/abc` |

## Features

### Visual Indicators
- **Unread Badge**: Blue dot on the right side for unread notifications
- **Read Status**: Background color change when marked as read
- **Type Icons**: Different icons for success, error, alert, and info
- **Deep Link Indicator**: "Tap to view →" text for clickable notifications

### Real-time Updates
- Notifications update in real-time via Realtime subscriptions (AppContext)
- Unread count updates automatically when notification is marked as read
- Panel closes after successful navigation

### Error Handling
- Graceful handling of invalid deep links
- Console logging of navigation errors
- Fallback to home page if link cannot be parsed
- User feedback via loading state

## Integration Points

### AppContext (`src/components/AppContext.tsx`)
- Manages global notification state
- Handles real-time notification subscriptions
- Provides notifications to all child components via context

### StudentLayout (`src/app/student/layout.tsx`)
- Receives notifications from AppContext
- Passes notifications to StudentHeader
- Calculates unread notification count for badge

### Authentication
- Notifications linked to authenticated user ID
- Row-Level Security ensures users see only their notifications
- Session-based access control

## Best Practices

1. **Always Provide Deep Links**: When creating notifications, include a `link` field for better UX
2. **Use Type-based Format**: Prefer type:id format for maintainability
3. **Test Navigation**: Verify that deep links correctly route to intended pages
4. **Handle Missing Content**: Ensure notification links point to content that still exists
5. **Monitor Performance**: Deep linking uses `router.push()` which is optimized in Next.js

## Future Enhancements

- [ ] Notification categories/filtering
- [ ] Notification history/archive
- [ ] Batch mark as read
- [ ] Notification preferences per user
- [ ] Desktop push notifications (PWA)
- [ ] Email notifications with deep link buttons
- [ ] Rich notification cards with preview content
- [ ] Notification scheduling

## Troubleshooting

### Notifications Not Appearing
- Check if user has unread notifications in database
- Verify AppContext is properly initialized
- Check browser console for subscription errors

### Deep Links Not Working
- Verify the route exists in the application
- Check if content ID exists in database
- Ensure link format is correct (type:id or /path)
- Check `parseDeepLink()` function in NotificationPanel

### Navigation Not Happening
- Check if `router.push()` is working
- Verify user authentication state
- Check for JavaScript errors in console
- Ensure route is accessible to user's role

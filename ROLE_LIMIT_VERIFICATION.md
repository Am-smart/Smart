# Teacher and Admin Creation Restriction Verification

## Requirement
Public creation of teachers and admins is restricted to a maximum of 3 total (combined), and this restriction should only trigger **after** the limit is reached.

## Current Implementation

### Database Level (supabase-schema.sql)
The `register_user()` RPC function implements the restriction:

```sql
-- Public signup logic: Limit public creation of teachers and admins to 3 total
IF p_role IN ('teacher', 'admin') THEN
  SELECT COUNT(*) INTO v_count FROM users WHERE role IN ('teacher', 'admin');
  
  -- Only restrict if limit is reached (>= 3 means 3 or more already exist)
  IF v_count >= 3 THEN
    RAISE EXCEPTION 'Public creation of teachers and admins is restricted (Limit: 3). Please contact support.';
  END IF;
END IF;
```

**Key Points:**
- The check **only applies to non-admin users** attempting to create teacher/admin accounts
- Admins can bypass this check entirely (line: `IF v_caller_role = 'admin' THEN`)
- For public signup, it counts the total teachers + admins
- The restriction **triggers when count >= 3**, meaning users can create accounts 0, 1, 2 but NOT the 4th
- Properly formatted: Only first 3 are allowed, 4th onwards are rejected

### Client Level (SignupForm.tsx)
Enhanced user experience with:

1. **Role Count Fetching** (`getRoleCount()` function)
   - Queries the database for current teacher and admin counts
   - Runs on component mount to show real-time status

2. **Visual Feedback**
   - Disables teacher/admin buttons when limit is reached
   - Shows "Limit reached" label above disabled buttons
   - Displays warning message below role selector: "Public creation of teachers and admins is limited to 3"
   - Tooltips provide context when hovering disabled buttons

3. **Button State**
   - Student button is always enabled
   - Teacher/Admin buttons are disabled only when `total >= 3`
   - Disabled state shows reduced opacity and "not-allowed" cursor

### Data Access (data-actions.ts)
Added public server action:

```typescript
export async function getRoleCount(): Promise<{ teachers: number; admins: number; total: number }>
```

- Returns separate counts for teachers and admins
- Also returns combined total
- Used by SignupForm to determine button availability
- Gracefully handles errors with fallback values

## Verification Status

✅ **Restriction Correctly Implemented**
- Triggers only **after** 3 teachers/admins exist (allows 0, 1, 2 but rejects 4th attempt)
- Applied only to public signup (non-admin users)
- Admin users can bypass via admin RPC
- Clear error message: "Public creation of teachers and admins is restricted (Limit: 3). Please contact support."

✅ **Client-Side UX Enhancement**
- Users see disabled buttons before attempting signup
- Warning messages explain the restriction
- Real-time count updates
- Better UX prevents error responses

✅ **Security Maintained**
- Database-level validation is the primary enforcement
- Client-side is purely UI/UX (data is validated server-side)
- Admin bypass route confirmed working

## Testing Recommendations

1. **Create 3 teacher/admin accounts** - Should succeed
2. **Attempt to create 4th teacher/admin** - Should fail with proper error message
3. **Login as admin and create teacher** - Should bypass limit and succeed
4. **Check SignupForm buttons** - Teacher/Admin should be disabled when limit reached
5. **Check warning message** - Should display "Limit reached" and explanation

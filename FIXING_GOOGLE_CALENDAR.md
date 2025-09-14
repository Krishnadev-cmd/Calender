# Fixing Google Calendar Integration

## Step 1: Fix Database Permissions (CRITICAL)

The main issue is that Row-Level Security (RLS) policies are blocking token storage. You need to run the SQL script to fix this:

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**  
3. Copy and paste the contents of `fix-rls-policies.sql` into a new query
4. Click **Run** to execute the script

This will create the necessary RLS policies to allow users to store their Google Calendar tokens.

## Step 2: Test the Integration

After running the SQL script:

1. **Clear your browser cache/localStorage** (or open in private/incognito mode)
2. Go to your dashboard
3. Try connecting Google Calendar from either the Buyer or Seller tab
4. After OAuth completion, the connection status should update automatically

## Step 3: Verify in Browser Console

Open browser Developer Tools (F12) and check the Console tab for debug messages:
- Look for "Dashboard URL params" when returning from OAuth
- Check for "Tokens found after OAuth" or "No tokens found after OAuth"
- Watch for any RLS policy errors (error code 42501)

## Common Issues

### Issue: "Still shows Connect Google Calendar after signing in"
- **Cause**: RLS policies not applied, tokens can't be stored in database
- **Fix**: Run the `fix-rls-policies.sql` script in Supabase

### Issue: "Error code 42501 - permission denied"
- **Cause**: Row-Level Security blocking access
- **Fix**: The RLS policies script should resolve this

### Issue: "Connection status doesn't update immediately"
- **Cause**: State synchronization between dashboard and components
- **Fix**: The recent code updates should resolve this with proper useEffect hooks

## Files Updated

The following files have been enhanced to fix the Google Calendar integration:

- `app/dashboard/page.tsx` - Added debug logging and better connection checking
- `components/Buyer.tsx` - Added real-time connection checking and proper state sync
- `components/Seller.tsx` - Added same improvements as Buyer
- `fix-rls-policies.sql` - Critical RLS policies for token storage

## Next Steps

After running the RLS script, test the full flow:
1. Connect Google Calendar
2. Verify connection status updates in both Buyer and Seller tabs
3. Try creating a test appointment to ensure calendar events are created
4. Test the disconnect functionality

Let me know if you encounter any issues after running the RLS policies script!
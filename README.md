# Calendar Appointment Booking System

A modern web application built with Next.js that allows users to book appointments with service providers and manage their calendars through Google Calendar integration.

## 🚀 Features

### For Buyers
- Browse available service providers
- View real-time availability 
- Book appointments with detailed descriptions
- Automatic Google Calendar event creation
- View and manage upcoming appointments
- Responsive design for all devices

### For Sellers
- Create and manage business profile
- Set availability and business hours
- View incoming appointment requests
- Update appointment status (pending, confirmed, cancelled)
- Google Calendar integration for seamless scheduling
- Professional dashboard interface

### Technical Features
- **Google Calendar OAuth 2.0 integration** - Bidirectional sync with Google Calendar
- **Real-time availability checking** - No double bookings
- **Supabase database** - Secure data storage with Row Level Security (RLS)
- **Next.js 15** - Modern React framework with Turbopack
- **Tailwind CSS** - Beautiful, responsive UI design
- **TypeScript** - Type-safe development
- **Server-side authentication** - Secure user management

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 18, TypeScript
- **Styling:** Tailwind CSS, Shadcn/ui components
- **Backend:** Next.js API Routes, Supabase
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **Calendar Integration:** Google Calendar API
- **Deployment:** Vercel-ready

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js 18+ installed
- A Supabase account and project
- Google Cloud Console project with Calendar API enabled
- Git installed

## ⚙️ Environment Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd calender
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase Setup

#### Database Schema

Run the following SQL commands in your Supabase SQL editor:

```sql
-- Create user profiles table
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('buyer', 'seller')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create seller profiles table
CREATE TABLE seller_profiles (
    id UUID REFERENCES user_profiles(id) ON DELETE CASCADE PRIMARY KEY,
    business_name TEXT,
    description TEXT,
    business_hours JSONB DEFAULT '{}',
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    buyer_email TEXT,
    seller_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Google Calendar tokens table
CREATE TABLE google_calendar_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('buyer', 'seller')),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, user_type)
);
```

#### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Seller profiles policies
CREATE POLICY "Anyone can view seller profiles" ON seller_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sellers can manage their own profile" ON seller_profiles
    FOR ALL USING (auth.uid() = id);

-- Appointments policies
CREATE POLICY "Users can view their appointments" ON appointments
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyers can create appointments" ON appointments
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Users can update their appointments" ON appointments
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Google Calendar tokens policies (service role only)
CREATE POLICY "Service role can manage all tokens" ON google_calendar_tokens
    FOR ALL TO service_role USING (true);
```

### 4. Google Calendar API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API
4. Create credentials (OAuth 2.0 Client ID)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (for development)
   - `https://yourdomain.com/api/auth/google/callback` (for production)
6. Copy the Client ID and Client Secret to your `.env.local`

## 🚀 Getting Started

### Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🌐 Deployment to Vercel

This app is optimized for deployment on Vercel. For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/calender)

**Key steps:**
1. Push your code to GitHub
2. Connect to Vercel and import your repository
3. Add environment variables in Vercel dashboard
4. Update Google OAuth redirect URIs with your Vercel domain
5. Update Supabase settings with your production URL

For complete setup instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 📱 Usage Guide

### Getting Started as a User

1. **Sign Up/Login**: Visit the app and create an account or sign in
2. **Choose Role**: Select whether you're a buyer (looking for services) or seller (providing services)
3. **Connect Google Calendar**: Link your Google Calendar for automatic event management

### For Buyers

1. **Browse Sellers**: View available service providers on the dashboard
2. **Select a Seller**: Click on a seller to view their profile and availability
3. **Choose Time Slot**: Pick from available time slots
4. **Book Appointment**: Fill in appointment details and confirm booking
5. **Manage Appointments**: View upcoming appointments in the "My Appointments" tab

### For Sellers

1. **Setup Profile**: Complete your business profile with name, description, and hours
2. **Manage Calendar**: Your Google Calendar integration shows availability automatically  
3. **Handle Bookings**: View and update appointment status in the "Appointments" tab
4. **Update Availability**: Modify your calendar to control when clients can book

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/callback` - Handle Supabase authentication
- `GET /api/auth/google/callback` - Handle Google OAuth callback

### Calendar Integration  
- `GET /api/calendar/events` - Fetch calendar events
- `POST /api/calendar/create-event` - Create calendar event
- `GET /api/calendar/user-info` - Get user calendar info
- `GET /api/store-tokens` - Retrieve OAuth tokens
- `POST /api/store-tokens` - Store OAuth tokens

### Appointments
- `GET /api/appointments` - Get user appointments
- `POST /api/appointments` - Create new appointment

### Sellers
- `GET /api/sellers/available` - Get available sellers

## 🔒 Security Features

- **Row Level Security (RLS)** on all database tables
- **Service Role Authentication** for sensitive operations
- **OAuth 2.0** for Google Calendar integration
- **Environment Variables** for sensitive configuration
- **Type Safety** with TypeScript
- **Input Validation** on all forms and API endpoints

## 🎨 UI/UX Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark/Light Themes** - Elegant color schemes
- **Loading States** - Smooth user experience with loading indicators
- **Error Handling** - Graceful error messages and recovery
- **Accessibility** - WCAG compliant components
- **Modern Design** - Clean, professional interface

## 📂 Project Structure

```
calender/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── appointments/  # Appointment management
│   │   ├── auth/         # Authentication handlers
│   │   ├── calendar/     # Google Calendar integration
│   │   ├── sellers/      # Seller data endpoints
│   │   └── store-tokens/ # OAuth token management
│   ├── auth/             # Auth pages
│   ├── dashboard/        # Main dashboard
│   └── login/           # Login page
├── components/           # React components
│   ├── ui/              # Shadcn/ui components
│   ├── Appointments.tsx # Appointment management
│   ├── Buyer.tsx        # Buyer dashboard
│   ├── RoleSelection.tsx # Role selection
│   └── Seller.tsx       # Seller dashboard
├── lib/                 # Utility libraries
│   ├── googleCalendar.ts    # Google Calendar client
│   ├── googleCalendarServer.ts # Server-side Calendar API
│   ├── supabase.ts          # Supabase client
│   └── utils.ts             # Utility functions
└── migrations/          # Database migrations
```

## 🐛 Troubleshooting

### Common Issues

**"Google Calendar not connecting"**
- Verify Google OAuth credentials in `.env.local`
- Check redirect URIs in Google Cloud Console
- Ensure Calendar API is enabled

**"Database connection errors"**
- Verify Supabase URL and keys
- Check RLS policies are properly set
- Ensure service role key has correct permissions

**"Appointments not showing"**
- Check user role selection
- Verify RLS policies allow data access
- Look for browser console errors

### Development Tips

- Use browser DevTools Network tab to debug API calls
- Check Supabase dashboard for database issues
- Verify environment variables are loaded correctly
- Monitor console for React/Next.js warnings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the Supabase and Google Calendar API documentation

---

**Built with ❤️ using Next.js, Supabase, and Google Calendar API**

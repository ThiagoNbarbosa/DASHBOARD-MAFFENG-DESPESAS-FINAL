# Expense Dashboard Application

## Overview

This is a full-stack expense management dashboard application built with React (frontend), Node.js/Express (backend), and PostgreSQL database. The application provides role-based access control with two user levels: regular users who can add expenses, and admin users who have full CRUD access plus analytics capabilities. The system is designed for managing business expenses with detailed categorization, payment tracking, and visual reporting.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI components with Tailwind CSS styling
- **Charts**: Chart.js for data visualization
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Session Management**: Express sessions with secure cookie configuration
- **File Structure**: Modular design with separate routes, storage, and server configuration

### Database Layer
- **Database**: PostgreSQL with Neon serverless integration
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management

## Key Components

### Authentication System
- Session-based authentication using Express sessions
- Role-based access control (user/admin)
- Protected routes and middleware for authorization
- No registration - users must be created manually by developers

### Expense Management
- Complete CRUD operations for expense records
- File upload capability for receipt images via Supabase Storage
- Advanced filtering by month, category, and contract number
- Role-based permissions (users can only create, admins have full access)

### Data Schema
The database includes two main tables:
- **Users**: Stores user credentials, names, roles, and metadata
- **Expenses**: Comprehensive expense records with categories, payment methods, contract tracking, and image storage

### Analytics Dashboard (Admin Only)
- Visual charts showing expense breakdowns by category
- Payment method distribution analysis
- Monthly trend reporting
- Advanced filtering capabilities for all analytics

## Data Flow

1. **Authentication Flow**: User logs in → session created → role-based access granted
2. **Expense Creation**: User fills form → image uploaded to Supabase → expense saved to PostgreSQL
3. **Data Retrieval**: Frontend queries backend API → database queried with filters → formatted data returned
4. **Analytics Generation**: Admin requests charts → backend aggregates data → Chart.js renders visualizations

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection via Neon
- **@supabase/supabase-js**: File storage and image management
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe database operations
- **express-session**: Session management
- **bcrypt**: Password hashing and verification

### UI and Styling
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **chart.js**: Data visualization library
- **lucide-react**: Icon library

### Development Tools
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development Environment
- Replit integration with auto-reload capability
- PostgreSQL 16 module for database provisioning
- Node.js 20 runtime environment
- Development server runs on port 5000

### Production Build
- Vite builds optimized frontend bundle
- esbuild creates server bundle with external dependencies
- Static files served from Express with Vite middleware in development
- Autoscale deployment target for production scaling

### Environment Configuration
- Database URL configuration via environment variables
- Session secret management for security
- Supabase credentials for file storage integration

## Changelog
- June 17, 2025: Initial setup - Created full-stack expense dashboard with React frontend and Express backend
- June 17, 2025: Database connection issue resolved - Updated to use Supabase pooler connection
- June 17, 2025: Authentication system working - Admin and user login functioning correctly
- June 18, 2025: Image upload issue identified and corrected - Frontend was using anonymous key instead of backend service role
- June 18, 2025: Logo MAFFENG added to sidebar replacing generic icon
- June 18, 2025: RLS policies documented for Supabase Storage bucket "receipts"
- June 19, 2025: Major filter improvements implemented - Added comprehensive filtering system with year, category, payment method filters for all users; Implemented separate "Filtered Expenses" section above recent expenses; Fixed filter logic to properly respect year selection; Updated sidebar menu item to "Despesas Recentes"

## User Preferences
Preferred communication style: Portuguese (Brazil), simple everyday language.

## Current Status
- Application fully functional and running on port 5000
- Database connected via Supabase pooler (PostgreSQL with node-postgres driver)
- User authentication working with demo accounts:
  - Admin: admin@empresa.com / senha123
  - User: user@empresa.com / senha123
- Supabase Storage configured for receipt image uploads
- All core features implemented: expense management, filtering, analytics charts
# Expense Dashboard Application

## Overview

This is a full-stack expense management dashboard application for business expense management, offering detailed categorization, payment tracking, and visual reporting. It features role-based access control with regular users for expense entry and admin users with full CRUD access and analytics. The application aims to provide a robust solution for financial oversight and reporting, optimized for both desktop and mobile use.

## User Preferences

Preferred communication style: Portuguese (Brazil), simple everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **UI Components**: Radix UI with Tailwind CSS
- **Charts**: Chart.js for data visualization
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Session Management**: Express sessions with secure cookies
- **Modular Design**: Separated routes, storage, and server configurations

### Database
- **Database**: PostgreSQL with `pg` (node-postgres) driver
- **ORM**: Drizzle ORM
- **Schema Management**: Drizzle Kit for migrations

### Core Features & Design Decisions
- **Authentication**: Session-based, role-based (user/admin) access control. Manual user creation by developers.
- **Expense Management**: CRUD operations for expenses, file upload for receipts (Supabase Storage), advanced filtering (month, category, contract, bank issuer). Dynamic contracts and categories managed via dedicated tables.
- **Analytics Dashboard (Admin Only)**: Visual charts for expense breakdown by category, payment method distribution, monthly trends, and comprehensive filtering. Financial charts (Category, Contract, Payment) with professional design and interactive tooltips.
- **Billing Management**: Restricted to admins, includes status tracking, filtering, and financial summaries.
- **Reporting**: Reports page with filtering and CSV/JSON download capabilities. Includes Excel import functionality with intelligent column detection, normalization, and detailed feedback. Drag & drop support for Excel files.
- **Mobile Optimization**: Comprehensive error prevention system (Error Boundary, Performance Monitor), mobile-optimized UI components (Filter Panel, Responsive Layout), and performance enhancements (Intelligent Cache, Network Optimization).
- **Security**: DOM security auditing, proper cleanup for Chart.js, and secure handling of sensitive data.
- **UI/UX**: Consistent color palette, modern design, touch-friendly interactions, and full responsiveness across desktop, tablet, and mobile devices. Dynamic forms for contracts and categories. Custom favicon for branding.
- **Data Handling**: Centralized date formatting to avoid timezone issues. Pagination implemented for large datasets.

## External Dependencies

### Core
- **PostgreSQL**: Via `pg` (node-postgres) driver for database connection.
- **Supabase Storage**: For receipt image uploads.
- **TanStack Query**: Server state management and caching.
- **Drizzle ORM**: Type-safe database operations.
- **Express-session**: Session management.
- **Bcrypt**: Password hashing.
- **Multer**: For handling file uploads (specifically Excel imports).
- **XLSX**: For parsing Excel files during import.

### UI & Styling
- **@radix-ui/**: Accessible UI component primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Chart.js**: Data visualization library.
- **Lucide-react**: Icon library.

### Development & Build Tools
- **Vite**: Frontend build tool and development server.
- **TSX**: TypeScript execution for Node.js.
- **esbuild**: Fast JavaScript bundler for production.
# ZIE Membership Application Portal

A comprehensive full-stack application for managing membership applications to the Zimbabwe Institution of Engineers (ZIE).

## Project Overview

This application provides a complete platform for:
- **Applicants**: Submit membership applications via the Form M1 interface
- **Sponsors**: Provide confidential appraisals for applicants
- **Administrators**: Verify applications and manage membership approvals

## Features

### 1. **Authentication & Authorization**
- JWT-based authentication for secure login/registration
- Role-based access control (Applicant, Admin, Sponsor)
- Password hashing with bcrypt
- Secure session management

### 2. **Form M1 - Membership Application**
- Multi-step stepper form with Angular Material
- **Step 1**: Personal Particulars (name, email, phone, national ID, etc.)
- **Step 2**: Education (institution, qualifications, year obtained)
- **Step 3**: Engineering Experience (company, position, duration, duties)
- **Step 4**: Membership Grade & Specialist Division selection
- **Step 5**: Sponsor nomination (3 professional sponsors required)
- **Step 6**: Application review and submission

### 3. **Dynamic Requirements**
- **Technician Grade**: Requires Diploma and 3+ years experience
- **Member Grade**: Requires Technical Project Report
- **Document uploads**: PDF files for certificates, national ID, reports
- Drag-and-drop file upload with thick border aesthetic

### 4. **Membership Grades**
- Student Member
- Graduate Member
- Technician (3+ years experience, diploma required)
- Technologist (3+ years experience, diploma required)
- Full Member (5+ years experience, technical report required)
- Fellow (10+ years experience, technical report required)

### 5. **Application Fee Calculation**
- Middleware-based fee calculation
- Exchange rate conversion (USD to ZWL/ZiG)
- Base fees: $45-$60 USD based on grade

### 6. **Sponsorship Workflow**
- On form submission, automated emails sent to 3 sponsors
- Unique confidential review links for each sponsor
- 8-question appraisal form
- Confidential responses hidden from applicants
- Admin can view all sponsor appraisals

### 7. **Admin Dashboard**
- **Application Checklist**: Verify documents (photo, signatures, certificates, national ID, reports)
- **Status Management**: Update to "Approved", "Pending", "Interview Required", or "Rejected"
- **Application Overview**: View all applications with filtering/search
- **Sponsor Appraisals**: Access confidential sponsor responses
- **Verification Workflow**: Complete checklist for each application

### 8. **Design Theme**
- **Color Scheme**: 
  - Primary: Sherpa Blue (#004A59)
  - Secondary/Highlight: Alpine Gold (#B99532)
  - Background: Professional White (#FFFFFF)
- **Thick Aesthetic**: 
  - 2.5px solid borders on all containers and inputs
  - Bold buttons (font-weight: 700)
  - 8px border-radius
  - Fixed header (80px height) with Alpine Gold bottom border

### 9. **Security Features**
- Helmet.js for security headers
- bcrypt password hashing
- JWT token-based authentication
- CORS protection
- Input validation and sanitization
- Confidential flag on sponsor responses

## Tech Stack

### Backend
- **Framework**: Node.js + Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer for automated sponsor invitations
- **Security**: Helmet, bcrypt, express-validator
- **API**: RESTful with validation middleware

### Frontend
- **Framework**: Angular 17
- **UI Components**: Angular Material (Stepper)
- **Styling**: SCSS with thick border theme
- **State Management**: RxJS Observables
- **HTTP**: Angular HttpClient with interceptors
- **Forms**: Reactive Forms with validation

## Project Structure

```
ZIE/
├── backend/
│   ├── src/
│   │   ├── models/           # MongoDB schemas
│   │   │   ├── User.ts
│   │   │   ├── Application.ts
│   │   │   └── MembershipGrade.ts
│   │   ├── routes/           # API routes
│   │   │   ├── authRoutes.ts
│   │   │   ├── applicationRoutes.ts
│   │   │   └── sponsorRoutes.ts
│   │   ├── controllers/      # Route handlers
│   │   │   ├── authController.ts
│   │   │   ├── applicationController.ts
│   │   │   └── sponsorController.ts
│   │   ├── middleware/       # Custom middleware
│   │   │   ├── auth.ts
│   │   │   └── feeCalculation.ts
│   │   ├── services/         # Business logic
│   │   │   └── emailService.ts
│   │   ├── index.ts          # Express server
│   │   └── config/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── pages/        # Page components
    │   │   │   ├── login.component.ts
    │   │   │   ├── register.component.ts
    │   │   │   ├── form-m1.component.ts
    │   │   │   ├── sponsor-review.component.ts
    │   │   │   └── admin-dashboard.component.ts
    │   │   ├── components/   # Reusable components
    │   │   │   └── header.component.ts
    │   │   ├── services/     # HTTP services
    │   │   │   ├── auth.service.ts
    │   │   │   ├── application.service.ts
    │   │   │   └── sponsor.service.ts
    │   │   ├── app.routes.ts
    │   │   └── app.component.ts
    │   ├── styles.scss       # Global styles with thick aesthetic
    │   ├── main.ts
    │   └── index.html
    ├── angular.json
    ├── package.json
    ├── tsconfig.json
    └── assets/
        └── zielogo.png      # ZIE logo

```

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (local or cloud)
- Angular CLI (v17+)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file from .env.example
cp .env.example .env

# Update .env with your configuration:
# - MONGODB_URI: MongoDB connection string
# - JWT_SECRET: Your secret key
# - SMTP_HOST, SMTP_USER, SMTP_PASS: Email configuration (CRITICAL - see Email Setup below)
# - EXCHANGE_RATE: ZWL/ZiG to USD rate
# - FRONTEND_URL: Frontend application URL (for sponsor appraisal links)

# Run the server
npm run dev      # Development with ts-node
npm run build    # Build TypeScript
npm start        # Production
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
ng serve

# Build for production
ng build

# Run tests
ng test
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (protected)

### Applications
- `POST /api/applications` - Create new application (protected)
- `GET /api/applications` - Get user's applications (protected)
- `GET /api/applications/:id` - Get application details (protected)
- `PUT /api/applications/:id/status` - Update status (admin only)
- `GET /api/applications/admin/all` - Get all applications (admin only)

### Sponsors
- `GET /api/sponsors/:token` - Get appraisal form (public)
- `POST /api/sponsors/:token/submit` - Submit appraisal (public)

## Email Templates

### Sponsor Appraisal Invitation
Sent on application submission to 3 listed sponsors with:
- Unique confidential review link
- Applicant information
- Instructions to complete 8-question appraisal

### Application Confirmation
Sent to applicant after submission with:
- Application ID
- Status confirmation
- Timeline expectations

### Admin Notification
Sent to ZIE admin staff with:
- New application alert
- Applicant name
- Link to admin dashboard

## File Upload Flow

1. **Drag-and-drop zones** with thick border styling
2. Files stored in `backend/uploads/`
3. File references saved in Application document
4. PDF validation on backend
5. Admin checklist for verification

## Security Considerations

- All passwords hashed with bcrypt
- JWT tokens expire after 24 hours
- Sponsor responses flagged as confidential
- National IDs and transcripts handled securely
- Helmet headers for XSS/CSRF protection
- Input validation on all endpoints
- CORS configured for frontend domain only

## Database Initialization

On server startup:
- Default membership grades automatically created
- MongoDB connection established
- Indexes created for performance

## Development Tips

### Hot Reload
- Backend: Uses ts-node with nodemon
- Frontend: Angular dev server with hot module replacement

### Testing Sponsor Workflow
1. Create application with test sponsor emails
2. Check backend logs for email sending
3. Use `/sponsor-review/:token` route with generated token
4. Submit test appraisal
5. View as admin in dashboard

### Admin Testing
- Create user with role "Admin"
- Login and navigate to `/admin-dashboard`
- View all applications with filtering
- Update application status
- View sponsor appraisals (confidential)

## Common Issues & Solutions

**MongoDB Connection Error**
- Ensure MongoDB is running locally or cloud URI is correct
- Check MONGODB_URI in .env file

**Email Not Sending**
- Verify SMTP credentials in .env
- Check Gmail App Password (not regular password)
- Enable "Less secure app access" if using Gmail

**CORS Errors**
- Frontend and backend running on different ports?
- Check CORS configuration in Express server
- Update FRONTEND_URL in .env

**File Upload Issues**
- Ensure `backend/uploads/` directory exists
- Check file size limits
- Verify PDF mime type validation

## Email Configuration

The ZIE portal sends automated sponsor appraisal invitations when applicants submit applications. **The system WILL NOT SEND EMAILS unless you configure real SMTP credentials.**

### Why Email Configuration Matters

1. When an applicant submits their Form M1, the system automatically sends confidential appraisal forms to their 3 sponsors
2. Sponsors need to receive these emails to complete the workflow
3. Without proper SMTP setup, sponsors never receive appraisal invitations

### Configuring SMTP

Edit `backend/.env` and update the SMTP settings. Your default `.env.example` has **placeholder values** - these MUST be replaced with real credentials.

#### Option 1: Gmail (Recommended for small deployments)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
FRONTEND_URL=http://localhost:4200
```

**Steps to get Gmail credentials**:
1. Enable 2-Factor Authentication on your Google account
2. Visit: https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer"
4. Google generates a 16-character password - copy this
5. Paste as SMTP_PASS in .env

**Important**: Use the **App Password**, not your regular Gmail password

#### Option 2: Office 365 / Outlook

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-outlook-password
FRONTEND_URL=http://localhost:4200
```

#### Option 3: Custom SMTP Server / Mailtrap

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
FRONTEND_URL=http://localhost:4200
```

### Testing Email Configuration

After updating `.env`:

1. **Restart the backend server**:
   ```bash
   # Stop current process (Ctrl+C)
   npm run dev
   ```

2. **Look for configuration confirmation**:
   - Open browser console (F12 → Network tab)
   - Submit a test application
   - Backend logs should show: `✓ Sponsor appraisal email sent successfully`

3. **Check sponsor inbox**:
   - Sponsor should receive email titled "ZIE Member Appraisal"
   - Email contains confidential appraisal link
   - Check spam folder if not found

### Email Troubleshooting

| Error | Solution |
|-------|----------|
| `SMTP NOT CONFIGURED: Email credentials are placeholders` | Replace placeholder values in .env with real credentials |
| `Error: Invalid login` | Verify SMTP_USER and SMTP_PASS are correct (check for spaces/quotes) |
| `INVALID EMAIL FORMAT: "invalid" is not a valid email` | Applicant entered invalid sponsor email in form |
| Email in spam folder | Check that SMTP_USER (From address) matches your email provider |
| No error but email not received | Check firewall allows outgoing SMTP on port 587 |

### Email Details

**Sender**: The address specified in SMTP_USER
**Recipients**: Sponsor email addresses from application form
**Subject**: `ZIE Member Appraisal - [Applicant Name]`
**Content**: Confidential sponsorship appraisal form with unique token link
**Token Expiry**: No expiry set (sponsors can review anytime)

For detailed email configuration help, see: [EMAIL_SETUP_COMPLETE.md](./EMAIL_SETUP_COMPLETE.md)

## Future Enhancements

- Payment integration for application fees
- SMS notifications for applicants
- Export applications to PDF
- Interview scheduling system
- Certificate generation
- Advanced analytics dashboard
- Multi-language support
- Mobile app version

## License

Proprietary - Zimbabwe Institution of Engineers

## Support

For issues or questions, contact ZIE administrative staff.

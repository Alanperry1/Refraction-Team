# Technical Documentation: The Refraction Dashboard

This document provides technical details about the architecture, code structure, and implementation of The Refraction Eye Prescription Dashboard.

## Architecture Overview

The application follows a modern full-stack architecture with a clear separation between the client and server:

### Client-side Architecture

```
client/
├── src/
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions and services
│   ├── pages/          # Page components
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # Main application component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
└── index.html          # HTML template
```

### Server-side Architecture

```
server/
├── auth.ts             # Authentication implementation
├── database-storage.ts # Database storage implementation
├── db.ts               # Database connection setup
├── index.ts            # Server entry point
├── routes.ts           # API route definitions
├── storage.ts          # Storage interface definition
└── vite.ts             # Development server setup
```

### Shared Code

```
shared/
└── schema.ts           # Shared data schema definitions
```

## Technology Choices

### Frontend
- **React**: Provides a component-based architecture for building dynamic user interfaces
- **TypeScript**: Adds static typing for better developer experience and code quality
- **TanStack Query**: Manages server state and caching for optimal data fetching
- **Shadcn UI**: Provides accessible, customizable UI components
- **Tailwind CSS**: Utility-first CSS framework for styling
- **React Hook Form**: Handles form state and validation
- **Zod**: Schema validation for type-safe forms
- **Wouter**: Lightweight routing library

### Backend
- **Node.js**: JavaScript runtime for the server
- **Express**: Web framework for handling HTTP requests
- **PostgreSQL**: Relational database for data persistence
- **Drizzle ORM**: Type-safe database toolkit for working with PostgreSQL
- **Passport.js**: Authentication middleware
- **Express-session**: Session management

### External APIs
- **Mailjet**: Email delivery service
- **MessageBird**: SMS delivery service

## Database Design

### Entity Relationship Diagram

```
+---------------+       +------------------+      +--------------------+
|    Users      |       |    Patients      |      |  SecuritySettings  |
+---------------+       +------------------+      +--------------------+
| id (PK)       |       | id (PK)          |      | id (PK)            |
| username      |       | name             |      | securityPin        |
| password      |       | phone            |      +--------------------+
+---------------+       | email            |
                       | location         |
                       | dob              |
                       | age              |
                       | examDate         |
                       | rightEye         |
                       | leftEye          |
                       | pdType           |
                       | pd               |
                       | pdOd             |
                       | pdOs             |
                       | status           |
                       | createdAt        |
                       | updatedAt        |
                       +------------------+
```

### Schema Definition

The application uses Drizzle ORM with a PostgreSQL database. The schema is defined in `shared/schema.ts` and includes:

#### Users Table
Stores authentication credentials for application users.

#### Patients Table
Stores patient information and prescription data.

#### SecuritySettings Table
Stores security settings like PIN for doctor verification.

## Authentication Flow

1. User submits credentials (username/password)
2. Server validates credentials against stored hashed passwords
3. On successful authentication, a session is created
4. Session ID is stored in a cookie on the client
5. Subsequent requests include the session cookie for authentication
6. Protected routes verify the session before processing the request

## PIN Verification Flow

1. User attempts to access doctor's review interface
2. Client checks if doctor is already verified in the session
3. If not verified, PIN verification dialog is displayed
4. User enters PIN
5. PIN is sent to server for verification
6. Server compares PIN with stored security settings
7. If correct, session is updated to mark doctor as verified
8. Client receives verification success and allows access

## Communication Services

### Email Service (Mailjet)

The application uses Mailjet for sending prescription emails to patients:

1. Client prepares HTML content with prescription details
2. HTML and recipient details are sent to the server
3. Server validates the request and checks authentication
4. If Mailjet API keys are available, the email is sent through Mailjet
5. If keys are not available, the system simulates sending

Implementation Files:
- `client/src/lib/mailjet-service.ts` - Client-side service
- `server/routes.ts` - Server endpoint for sending emails

### SMS Service (MessageBird)

The application uses MessageBird for sending SMS notifications:

1. Client prepares text content with prescription summary
2. Phone number and content are sent to the MessageBird API
3. If API key is not available, the system simulates sending

Implementation Files:
- `client/src/lib/sms-service.ts` - SMS service implementation

## Data Import System

The application can parse prescription data from text files using several methods:

1. Parse structured text files with clear sections
2. Extract data using regular expressions
3. Convert extracted data to patient form data
4. Allow user to review and confirm before saving

Implementation Files:
- `client/src/lib/data-parser.ts` - Parser implementation

## Security Measures

### Password Hashing

User passwords are hashed using scrypt with random salt:

```typescript
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}
```

### Session Security

Sessions are secured with the following measures:
- Secure cookies
- CSRF protection
- Session timeout
- Secure session store

### PIN Protection

Sensitive operations are protected with a PIN:
- PIN is stored in the database
- PIN verification state is tracked in the session
- PIN is required for doctor interface access
- PIN is required for deleting or modifying sensitive data

## API Endpoints Documentation

### Authentication Endpoints

#### POST /api/login
Authenticates a user and creates a session.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "id": "number",
  "username": "string"
}
```

**Response (401):**
```json
{
  "message": "Invalid credentials"
}
```

#### POST /api/logout
Ends the current user session.

**Response (200):**
```json
{}
```

#### GET /api/user
Returns the current authenticated user.

**Response (200):**
```json
{
  "id": "number",
  "username": "string"
}
```

**Response (401):**
```json
{
  "message": "Not authenticated"
}
```

### Patient Endpoints

#### GET /api/patients
Returns all patients.

**Response (200):**
```json
[
  {
    "id": "number",
    "name": "string",
    "phone": "string",
    "email": "string",
    "location": "string",
    "dob": "string",
    "age": "number",
    "examDate": "string",
    "rightEye": {
      "sph": "number",
      "cyl": "number",
      "axis": "number",
      "add": "number"
    },
    "leftEye": {
      "sph": "number",
      "cyl": "number",
      "axis": "number",
      "add": "number"
    },
    "pdType": "string",
    "pd": "number|null",
    "pdOd": "number|null",
    "pdOs": "number|null",
    "status": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

#### GET /api/patients/:id
Returns a specific patient by ID.

**Response (200):**
```json
{
  "id": "number",
  "name": "string",
  // ... other patient fields
}
```

**Response (404):**
```json
{
  "message": "Patient not found"
}
```

#### POST /api/patients
Creates a new patient.

**Request Body:**
```json
{
  "name": "string",
  "phone": "string",
  "email": "string",
  "location": "string",
  "dob": "string",
  "examDate": "string",
  "rightEye": {
    "sph": "number",
    "cyl": "number",
    "axis": "number",
    "add": "number"
  },
  "leftEye": {
    "sph": "number",
    "cyl": "number",
    "axis": "number",
    "add": "number"
  },
  "pdType": "string",
  "pd": "number|null",
  "pdOd": "number|null",
  "pdOs": "number|null"
}
```

**Response (201):**
```json
{
  "id": "number",
  "name": "string",
  // ... all patient fields including auto-calculated age
}
```

#### PATCH /api/patients/:id
Updates an existing patient.

**Request Body:** (Same as POST /api/patients)

**Response (200):**
```json
{
  "id": "number",
  "name": "string",
  // ... updated patient fields
}
```

#### PATCH /api/patients/:id/status
Updates a patient's status.

**Request Body:**
```json
{
  "status": "pending|reviewed"
}
```

**Response (200):**
```json
{
  "id": "number",
  "name": "string",
  // ... patient fields with updated status
}
```

#### DELETE /api/patients/:id
Deletes a patient.

**Response (204):** No content

### Security Endpoints

#### GET /api/security-settings
Gets security settings.

**Response (200):**
```json
{
  "id": "number",
  "securityPin": "string"
}
```

#### PATCH /api/security-settings
Updates security settings.

**Request Body:**
```json
{
  "securityPin": "string"
}
```

**Response (200):**
```json
{
  "id": "number",
  "securityPin": "string"
}
```

#### POST /api/verify-doctor
Verifies the doctor PIN.

**Request Body:**
```json
{
  "pin": "string"
}
```

**Response (200):**
```json
{
  "success": true
}
```

**Response (403):**
```json
{
  "message": "Invalid PIN"
}
```

#### GET /api/doctor-status
Checks if doctor is verified in current session.

**Response (200):**
```json
{
  "verified": "boolean"
}
```

### Communication Endpoints

#### POST /api/email/send
Sends an email with prescription details.

**Request Body:**
```json
{
  "to": "string",
  "subject": "string",
  "html": "string",
  "patientName": "string"
}
```

**Response (200):**
```json
{
  "message": "Email sent successfully",
  "mailjetResponse": "object|null"
}
```

## Deployment Considerations

### Environment Variables

The following environment variables should be set:

- `DATABASE_URL`: PostgreSQL connection string
- `MAILJET_API_KEY`: Mailjet API Key
- `MAILJET_SECRET_KEY`: Mailjet Secret Key
- `MESSAGEBIRD_API_KEY`: MessageBird API Key

### Database Migrations

The application uses Drizzle ORM's push functionality to update the database schema. Use the following command:

```bash
npm run db:push
```

### Production Recommendations

1. Use a production-ready PostgreSQL database
2. Set up proper logging
3. Configure session store for production (Redis recommended)
4. Set up HTTPS with proper SSL certificate
5. Implement rate limiting for API endpoints
6. Enable CORS with appropriate origin restrictions
7. Set up monitoring and error tracking

## Testing Strategy

### Unit Testing

Focus on testing:
- Utility functions
- Data parsers
- Form validation

### Integration Testing

Focus on testing:
- API endpoints
- Authentication flows
- Database operations

### End-to-End Testing

Focus on testing:
- User flows
- Form submissions
- Data display

## Performance Considerations

1. Implement pagination for patient list
2. Add caching for frequently accessed data
3. Optimize database queries with indexes
4. Lazy load components for better initial loading
5. Implement debouncing for search inputs

## Accessibility Considerations

1. Proper form labeling
2. Keyboard navigation support
3. ARIA attributes for custom components
4. Color contrast compliance
5. Screen reader compatibility

## Future Expansion Possibilities

1. Multi-user support with different roles (admin, doctor, assistant)
2. Patient appointment scheduling
3. Integration with electronic health record systems
4. Billing and payment processing
5. Patient portal for self-service access to prescriptions
6. Mobile application for on-the-go access
7. Data analytics and reporting features
8. Inventory management for optical products
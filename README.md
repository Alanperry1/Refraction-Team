# The Refraction - Eye Prescription Dashboard

A comprehensive eye prescription management dashboard for optometrists to create, view, edit, and share patient prescription records.

![The Refraction Dashboard](./generated-icon.png)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Security](#security)
- [Communication Features](#communication-features)
- [Doctor's Review Interface](#doctors-review-interface)
- [Troubleshooting](#troubleshooting)

## Overview

The Refraction is a web-based application designed for optometrists and eye care professionals to manage patient eye prescription data efficiently. It enables healthcare providers to store, analyze, and share prescription information with patients while maintaining proper access controls and data security.

## Features

### Patient Management
- Create, view, edit, and delete patient records
- Store comprehensive eye prescription data including:
  - Spherical power (SPH)
  - Cylindrical power (CYL)
  - Axis
  - Addition power (ADD)
  - Pupillary distance (PD) - Single or dual measurements
- Track patient demographics and visit history
- View a list of all patients with filtering and sorting capabilities

### Data Import
- Parse prescription data from text files
- Import patient information through file uploads
- Automatic extraction of prescription values from structured text

### Prescription Communication
- Share prescriptions with patients via email using Mailjet
- Send prescription summaries via SMS using MessageBird
- Generate professional-looking HTML-formatted prescription emails

### Doctor's Interface
- Secure PIN-based access to the doctor's review interface
- Review and update patient prescription status
- Add professional recommendations and notes
- Generate clinical language for patient communications

### Security
- User authentication with username/password
- Role-based access control
- Separate PIN verification for sensitive operations
- Database storage of patient records
- Session management for secure access

## Tech Stack

### Frontend
- React with TypeScript
- TanStack Query for data fetching
- Shadcn UI components
- Tailwind CSS for styling
- React Hook Form for form management
- Zod for validation
- Wouter for routing

### Backend
- Node.js with Express
- PostgreSQL with Drizzle ORM
- Passport.js for authentication
- Session-based authentication and authorization
- RESTful API architecture

### External Services
- Mailjet for email delivery
- MessageBird for SMS delivery

## Installation

### Prerequisites
- Node.js (v16+)
- PostgreSQL database

### Setup Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/the-refraction.git
   cd the-refraction
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/refraction
   MAILJET_API_KEY=your_mailjet_api_key
   MAILJET_SECRET_KEY=your_mailjet_secret_key
   MESSAGEBIRD_API_KEY=your_messagebird_api_key
   ```

4. Initialize the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Configuration

### Email Configuration (Mailjet)
To enable email functionality, you need to:
1. Create a Mailjet account at [https://www.mailjet.com/](https://www.mailjet.com/)
2. Obtain your API Key and Secret Key
3. Add them to your environment variables:
   - MAILJET_API_KEY
   - MAILJET_SECRET_KEY

### SMS Configuration (MessageBird)
To enable SMS functionality, you need to:
1. Create a MessageBird account at [https://www.messagebird.com/](https://www.messagebird.com/)
2. Obtain your API Key
3. Add it to your environment variables:
   - MESSAGEBIRD_API_KEY

### Security PIN Configuration
The default security PIN for doctor access is set to "1234". You can change this through the application interface.

## Usage

### Authentication
1. Default admin credentials:
   - Username: admin
   - Password: admin

### Patient Management
1. Create a new patient record
   - Fill in patient details
   - Enter prescription data for both eyes
   - Save the record

2. View patient details
   - Browse the patient list
   - Click on a patient to view details
   - Review the full prescription information

3. Update patient records
   - Edit patient information
   - Update prescription values
   - Save changes

4. Delete patient records (requires PIN verification)

### Doctor's Review
1. Access the doctor review interface (requires PIN verification)
2. View patient prescriptions in clinical format
3. Add professional recommendations
4. Update patient status from "pending" to "reviewed"
5. Save notes with doctor's signature

### Communication
1. Email prescriptions to patients
   - View a patient's record
   - Click "Send by Email"
   - Enter recipient email address
   - Send the formatted prescription

2. SMS prescriptions to patients
   - View a patient's record
   - Click "Send by SMS"
   - Confirm the patient's phone number
   - Send the text message

### Data Import
1. Upload a text file with prescription data
2. The system will automatically parse and extract the relevant information
3. Review and confirm the extracted data
4. Save as a new patient record

## API Endpoints

### Authentication
- `POST /api/login` - Authenticate a user
- `POST /api/logout` - Logout current user
- `GET /api/user` - Get current user information

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get a specific patient
- `POST /api/patients` - Create a new patient
- `PATCH /api/patients/:id` - Update a patient
- `PATCH /api/patients/:id/status` - Update patient status
- `DELETE /api/patients/:id` - Delete a patient

### Security
- `GET /api/security-settings` - Get security settings
- `PATCH /api/security-settings` - Update security settings
- `POST /api/verify-doctor` - Verify doctor PIN
- `GET /api/doctor-status` - Check if doctor is verified

### Communication
- `POST /api/email/send` - Send email with prescription

## Database Schema

### Users
- id: Primary key
- username: String
- password: String (hashed)

### Patients
- id: Primary key
- name: String
- phone: String
- email: String
- location: String
- dob: String (date of birth)
- age: Number
- examDate: String
- rightEye: JSON object
  - sph: Number
  - cyl: Number
  - axis: Number
  - add: Number
- leftEye: JSON object
  - sph: Number
  - cyl: Number
  - axis: Number
  - add: Number
- pdType: String ("single" or "dual")
- pd: Number (nullable, for single PD)
- pdOd: Number (nullable, for dual PD, right eye)
- pdOs: Number (nullable, for dual PD, left eye)
- status: String ("pending" or "reviewed")
- createdAt: Date
- updatedAt: Date

### SecuritySettings
- id: Primary key
- securityPin: String

## Security

### Authentication
The application uses a session-based authentication system with Passport.js. Passwords are securely hashed using scrypt.

### Authorization
Different levels of access are implemented:
1. Basic user access - View patient records
2. PIN-verified access - Required for doctor's review interface and sensitive operations

### Data Protection
1. All database connections are secured
2. Passwords are hashed and never stored in plain text
3. Sensitive operations require PIN verification
4. Session timeout for security

## Communication Features

### Email (Mailjet)
- Professional HTML-formatted prescription emails
- Includes full prescription details
- Can include doctor's notes and signature
- Proper error handling and delivery confirmation

### SMS (MessageBird)
- Concise prescription summaries via text message
- Patient-friendly format
- Works with international phone numbers
- Fallback simulation when API key is not available

## Doctor's Review Interface

The doctor's review interface provides a specialized view for healthcare professionals to:

1. Review patient prescriptions in clinical terminology
2. Add professional recommendations based on prescription data
3. Include personalized notes for patients
4. Sign off on prescriptions with a digital signature
5. Change patient status from "pending" to "reviewed"

Access to this interface requires PIN verification to ensure proper separation of duties.

## Troubleshooting

### Email Issues
- Verify Mailjet API keys are correctly set
- Check email format is valid
- Review server logs for Mailjet error messages

### SMS Issues
- Verify MessageBird API key is correctly set
- Ensure phone numbers include country code
- Check server logs for MessageBird error messages

### Database Issues
- Verify PostgreSQL connection details
- Check that database schema is properly initialized
- Review server logs for database-related errors

### Authentication Issues
- Default admin credentials: admin/admin
- If locked out, check server logs for authentication issues
- Session issues may require clearing browser cookies

---

## License

[MIT License](LICENSE)

## Support

For questions or issues, please open an issue in the GitHub repository.
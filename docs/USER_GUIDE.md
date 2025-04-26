# The Refraction - User Guide

This user guide provides step-by-step instructions for using The Refraction eye prescription dashboard.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Logging In](#logging-in)
3. [Dashboard Overview](#dashboard-overview)
4. [Managing Patients](#managing-patients)
5. [Working with Prescriptions](#working-with-prescriptions)
6. [Doctor's Review Interface](#doctors-review-interface)
7. [Sending Prescriptions](#sending-prescriptions)
8. [Importing Prescription Data](#importing-prescription-data)
9. [Security Settings](#security-settings)
10. [Troubleshooting](#troubleshooting)

## Getting Started

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection
- Screen resolution of 1280x720 or higher (recommended)

### Accessing the Application

Access The Refraction dashboard through your browser at the URL provided by your administrator.

## Logging In

1. On the login page, enter your username and password
2. Default credentials:
   - Username: `admin`
   - Password: `admin`
3. Click the "Login" button

**Important**: For security reasons, please change the default password after your first login.

## Dashboard Overview

After logging in, you'll see the main dashboard with the following areas:

1. **Navigation Sidebar**: Access different sections of the application
2. **Patient List**: View and search through your patients
3. **Quick Actions**: Create new patients or access commonly used features
4. **Status Summary**: See counts of pending and reviewed prescriptions

## Managing Patients

### Viewing Patient List

1. From the dashboard, click on "Patients" in the sidebar
2. The patient list shows:
   - Patient name
   - Date of birth
   - Exam date
   - Prescription status (pending/reviewed)
3. Use the search box to filter patients by name
4. Sort patients by clicking on column headers

### Creating a New Patient

1. Click the "Add Patient" button in the top-right corner
2. Fill in the patient details form:
   - **Personal Information**:
     - Full Name
     - Date of Birth
     - Phone Number
     - Email Address
     - Location
   - **Exam Information**:
     - Exam Date
   - **Prescription Details**:
     - Right Eye (OD): SPH, CYL, AXIS, ADD
     - Left Eye (OS): SPH, CYL, AXIS, ADD
     - Pupillary Distance (PD): Select single or dual measurements
3. Click "Save" to create the patient record

### Viewing Patient Details

1. From the patient list, click on a patient's name
2. The patient details page shows:
   - Patient information
   - Prescription details
   - Communication history
   - Review status

### Editing Patient Information

1. On the patient details page, click the "Edit" button
2. Update the patient information as needed
3. Click "Save" to update the patient record

### Deleting a Patient

1. On the patient details page, click the "Delete" button
2. A confirmation dialog will appear
3. Enter the security PIN
4. Click "Confirm" to permanently delete the patient record

## Working with Prescriptions

### Understanding Prescription Values

The prescription includes the following measurements:

- **SPH (Sphere)**: Corrects nearsightedness or farsightedness
  - Positive values (+) indicate farsightedness
  - Negative values (-) indicate nearsightedness
- **CYL (Cylinder)**: Corrects astigmatism
  - Usually a negative value
- **AXIS**: Direction of astigmatism correction
  - Measured in degrees (0-180)
- **ADD**: Additional magnification for reading
  - Typically for presbyopia or reading glasses
- **PD (Pupillary Distance)**: Distance between the centers of the pupils
  - Single measurement: One value for both eyes
  - Dual measurement: Separate values for each eye (PD OD and PD OS)

### Reviewing Prescription Details

On the patient details page:

1. The prescription section shows all eye measurements
2. Values are formatted with proper signs and units
3. The prescription status indicates if a doctor has reviewed it

## Doctor's Review Interface

The doctor's review interface provides additional functionality for optometrists to review and approve prescriptions.

### Accessing Doctor's Review

1. On a patient's details page, click the "Doctor Review" button
2. If prompted, enter the security PIN
3. You will be redirected to the doctor's review interface

### Using the Doctor's Review Interface

The interface includes:

1. **Patient Information**: Demographics and medical history
2. **Prescription Review**: Formatted in clinical notation
3. **Recommendations**: Generate professional recommendations based on the prescription
4. **Doctor's Notes**: Add clinical notes for the patient
5. **Review Status**: Change the status from "pending" to "reviewed"
6. **Doctor's Signature**: Add your name or credentials

### Adding Clinical Recommendations

1. In the doctor's review interface, click "Generate Recommendations"
2. The system will suggest recommendations based on the prescription values
3. Edit the recommendations as needed
4. Add your clinical notes in the "Doctor's Notes" field
5. Add your name or credentials in the "Signature" field
6. Click "Save and Mark as Reviewed"

## Sending Prescriptions

### Sending Prescriptions via Email

1. On the patient details page, click "Send by Email"
2. Enter or confirm the recipient's email address
3. Customize the email message if needed
4. Click "Send Email"
5. A confirmation message will appear when the email is sent

The email includes:
- Patient information
- Complete prescription details
- Doctor's recommendations (if reviewed)
- Formatted in a professional HTML template

### Sending Prescriptions via SMS

1. On the patient details page, click "Send by SMS"
2. Enter or confirm the recipient's phone number
3. Click "Send SMS"
4. A confirmation message will appear when the SMS is sent

The SMS includes:
- Patient name
- Brief prescription summary
- Link to access full prescription details (if available)

## Importing Prescription Data

The Refraction supports importing patient prescription data from text files.

### Supported File Formats

- Text files (.txt) with structured prescription data

### Importing from a Text File

1. Click "Add Patient" to start a new patient record
2. Click "Import from File" at the top of the form
3. Select a text file from your computer
4. The system will extract patient and prescription data
5. Review the extracted information
6. Make any necessary corrections
7. Click "Save" to create the patient record

### Text File Format

For optimal extraction, structure your text files as follows:

```
Patient: John Doe
Phone: (555) 123-4567
Email: john@example.com
Location: New York, NY
DOB: 1985-05-15
Exam Date: 2025-04-25

--- Right Eye ---
SPH: -2.25
CYL: -0.75
AXIS: 180
ADD: +1.50

--- Left Eye ---
SPH: -2.00
CYL: -0.50
AXIS: 175
ADD: +1.50

PD: 64
```

## Security Settings

### Changing the Security PIN

The security PIN is used to protect sensitive operations such as doctor's review access and patient deletion.

1. Click on your username in the top-right corner
2. Select "Security Settings" from the dropdown menu
3. Enter the current PIN
4. Enter the new PIN
5. Confirm the new PIN
6. Click "Update PIN"

**Default PIN**: The default security PIN is `1234`. Be sure to change this for security reasons.

## Troubleshooting

### Login Issues

- **Forgotten Password**: Contact your system administrator to reset your password
- **Login Errors**: Ensure caps lock is not enabled and your username is spelled correctly

### Email Sending Issues

- **Emails Not Sending**: Verify that email services are properly configured
- **Invalid Email Format**: Ensure the recipient's email address is correctly formatted

### SMS Sending Issues

- **SMS Not Sending**: Verify that SMS services are properly configured
- **Invalid Phone Number**: Ensure the phone number includes the country code (e.g., +1 for US)

### Data Import Issues

- **Import Not Working**: Ensure the text file follows the expected format
- **Missing Data**: Manually add any information that couldn't be extracted from the file

### General Issues

- **Page Not Loading**: Try refreshing the browser
- **Unexpected Errors**: Log out and log back in to the application
- **Data Not Saving**: Check your internet connection and try again

---

For additional support, please contact your system administrator or the support team.
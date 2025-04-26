# API Integration Guide

This document provides information about integrating with external services and APIs in The Refraction eye prescription dashboard.

## Email Integration (Mailjet)

The Refraction uses Mailjet for sending prescription emails to patients. This section describes how to configure and use the Mailjet integration.

### Configuration

1. **Prerequisites**:
   - A Mailjet account ([Sign up here](https://www.mailjet.com/))
   - Mailjet API Key and Secret Key

2. **Environment Variables**:
   Set the following environment variables:
   ```
   MAILJET_API_KEY=your_api_key
   MAILJET_SECRET_KEY=your_secret_key
   ```

3. **Sender Address**:
   The default sender address is `no-reply@therefractionapp.com`. This should be a verified sender address in your Mailjet account.

### Implementation Details

#### Server-side Implementation

The server initializes the Mailjet client in `server/routes.ts`:

```typescript
// Initialize Mailjet if API keys are present
let mailjetClient: any = null;
if (process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY) {
  mailjetClient = Mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_SECRET_KEY
  );
  console.log("Mailjet initialized with API keys");
} else {
  console.log("Mailjet API keys not found. Email functionality will be simulated.");
}
```

The email sending endpoint is defined in `server/routes.ts`:

```typescript
app.post("/api/email/send", async (req, res) => {
  // Validate authentication and request data
  
  // Send email using Mailjet
  const data = {
    Messages: [
      {
        From: {
          Email: "no-reply@therefractionapp.com",
          Name: "The Refraction Team"
        },
        To: [
          {
            Email: to,
            Name: patientName || "Patient"
          }
        ],
        Subject: subject,
        HTMLPart: html
      }
    ]
  };
  
  const result = await mailjetClient.post("send", { version: "v3.1" }).request(data);
  
  // Return response
});
```

#### Client-side Implementation

The client-side email service is implemented in `client/src/lib/mailjet-service.ts`:

```typescript
export async function sendPrescriptionEmail(
  patient: Patient,
  recipientEmail: string,
  doctorNotes?: string,
  doctorSignature?: string
): Promise<{ success: boolean; error?: string }> {
  // Format email content
  let emailHtml = formatPrescriptionForEmail(patient);
  
  // Add doctor notes if provided
  
  // Make API request to send email
  const response = await fetch('/api/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: recipientEmail,
      subject: `Vision Prescription for ${patient.name}`,
      html: emailHtml,
      patientName: patient.name
    })
  });
  
  // Handle response
}
```

### Testing

To test email functionality:
1. Set up the environment variables
2. Log in to the application
3. View a patient's details
4. Click "Send by Email"
5. Enter a valid email address
6. Check the recipient's inbox

### Fallback Mechanism

If Mailjet API keys are not configured, the application will simulate email sending:

```typescript
// If Mailjet API keys not configured, simulate sending
if (!mailjetClient) {
  console.log(`Simulating email send to ${to} for ${patientName}`);
  
  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return res.status(200).json({ 
    message: "Email simulated successfully",
    simulated: true
  });
}
```

## SMS Integration (MessageBird)

The Refraction uses MessageBird for sending SMS notifications with prescription information. This section describes how to configure and use the MessageBird integration.

### Configuration

1. **Prerequisites**:
   - A MessageBird account ([Sign up here](https://www.messagebird.com/))
   - MessageBird API Key

2. **Environment Variables**:
   Set the following environment variable:
   ```
   MESSAGEBIRD_API_KEY=your_api_key
   ```

3. **Originator**:
   The default originator (sender name) is `TheRefraction`. This can be customized when initializing the MessageBird client.

### Implementation Details

#### Client-side Implementation

The SMS service is implemented in `client/src/lib/sms-service.ts`:

```typescript
export class MessageBirdProvider implements SmsProvider {
  private apiKey: string;
  private originator: string;

  constructor(apiKey: string, originator: string = 'TheRefraction') {
    this.apiKey = apiKey;
    this.originator = originator;
  }

  async sendSms(phoneNumber: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Initialize MessageBird client
      const messagebird = require('messagebird')(this.apiKey);
      
      // Send the SMS
      return new Promise((resolve) => {
        messagebird.messages.create({
          originator: this.originator,
          recipients: [phoneNumber],
          body: message
        }, (err: any, response: any) => {
          if (err) {
            resolve({ success: false, error: err.message });
          } else {
            resolve({ success: true });
          }
        });
      });
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send SMS'
      };
    }
  }
}
```

The SMS service initialization:

```typescript
export const initSmsService = () => {
  // Check for MessageBird API key in environment
  const messageBirdApiKey = import.meta.env.VITE_MESSAGEBIRD_API_KEY;
  
  if (messageBirdApiKey) {
    return new MessageBirdProvider(messageBirdApiKey);
  } else {
    console.warn("MessageBird API key not found. SMS functionality will be simulated.");
    return {
      sendSms: async (phoneNumber: string, message: string) => {
        console.log("MessageBird API key is not set. Simulating SMS send...");
        console.log(`Would send to ${phoneNumber}: ${message}`);
        
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { success: true };
      }
    };
  }
};
```

The format for SMS messages:

```typescript
export const formatPrescriptionForSms = (patient: Patient): string => {
  return `
Vision Prescription for ${patient.name}
Exam Date: ${formatDate(patient.examDate)}

Right Eye:
SPH: ${formatDiopter(patient.rightEye.sph)} CYL: ${formatDiopter(patient.rightEye.cyl)} AXIS: ${patient.rightEye.axis}° ADD: ${formatDiopter(patient.rightEye.add)}

Left Eye:
SPH: ${formatDiopter(patient.leftEye.sph)} CYL: ${formatDiopter(patient.leftEye.cyl)} AXIS: ${patient.leftEye.axis}° ADD: ${formatDiopter(patient.leftEye.add)}

PD: ${patient.pdType === 'single' ? `${patient.pd}mm` : `${patient.pdOd}mm (R) / ${patient.pdOs}mm (L)`}

From The Refraction Dashboard
`.trim();
};
```

### Testing

To test SMS functionality:
1. Set up the environment variable
2. Log in to the application
3. View a patient's details
4. Click "Send by SMS"
5. Confirm the phone number
6. Check the recipient's phone for the message

### Fallback Mechanism

If the MessageBird API key is not configured, the application will simulate SMS sending with console logging.

## Data Import Integration

The Refraction includes functionality to parse prescription data from text files. This section describes how this integration works.

### Supported Formats

Currently, the system supports parsing prescription data from:
- Text files (.txt) with structured prescription data

### Implementation Details

The parsing functionality is implemented in `client/src/lib/data-parser.ts`:

```typescript
/**
 * Parse a text file that follows a structured format with clear sections
 */
function parseStructuredTextFormat(text: string): Partial<PatientFormData> {
  // Extract patient information
  const patientInfo: Partial<PatientFormData> = {};
  
  // Match patient details section
  const patientMatch = text.match(/Patient:\s*(.+?)(?:\n|$)/);
  if (patientMatch) patientInfo.name = patientMatch[1].trim();
  
  // Match phone
  const phoneMatch = text.match(/Phone:\s*(.+?)(?:\n|$)/);
  if (phoneMatch) patientInfo.phone = phoneMatch[1].trim();
  
  // Match email
  const emailMatch = text.match(/Email:\s*(.+?)(?:\n|$)/);
  if (emailMatch) patientInfo.email = emailMatch[1].trim();
  
  // Match location
  const locationMatch = text.match(/Location:\s*(.+?)(?:\n|$)/);
  if (locationMatch) patientInfo.location = locationMatch[1].trim();
  
  // Match DOB
  const dobMatch = text.match(/DOB:\s*(.+?)(?:\n|$)/);
  if (dobMatch) patientInfo.dob = dobMatch[1].trim();
  
  // Match exam date
  const examDateMatch = text.match(/Exam Date:\s*(.+?)(?:\n|$)/);
  if (examDateMatch) patientInfo.examDate = examDateMatch[1].trim();
  
  // Extract right eye data
  const rightEyeSection = text.match(/---\s*Right Eye\s*---([\s\S]*?)(?:---|\n\n|$)/);
  if (rightEyeSection) {
    const rightEyeText = rightEyeSection[1];
    patientInfo.rightEye = {
      sph: parseFloat(rightEyeText.match(/SPH:\s*([-+]?\d+\.?\d*)/)?.[1] || '0'),
      cyl: parseFloat(rightEyeText.match(/CYL:\s*([-+]?\d+\.?\d*)/)?.[1] || '0'),
      axis: parseInt(rightEyeText.match(/AXIS:\s*(\d+)/)?.[1] || '0'),
      add: parseFloat(rightEyeText.match(/ADD:\s*([-+]?\d+\.?\d*)/)?.[1] || '0')
    };
  }
  
  // Extract left eye data
  const leftEyeSection = text.match(/---\s*Left Eye\s*---([\s\S]*?)(?:---|\n\n|$)/);
  if (leftEyeSection) {
    const leftEyeText = leftEyeSection[1];
    patientInfo.leftEye = {
      sph: parseFloat(leftEyeText.match(/SPH:\s*([-+]?\d+\.?\d*)/)?.[1] || '0'),
      cyl: parseFloat(leftEyeText.match(/CYL:\s*([-+]?\d+\.?\d*)/)?.[1] || '0'),
      axis: parseInt(leftEyeText.match(/AXIS:\s*(\d+)/)?.[1] || '0'),
      add: parseFloat(leftEyeText.match(/ADD:\s*([-+]?\d+\.?\d*)/)?.[1] || '0')
    };
  }
  
  // Extract PD
  const pdMatch = text.match(/PD:\s*(\d+)/);
  if (pdMatch) {
    patientInfo.pdType = 'single';
    patientInfo.pd = parseInt(pdMatch[1]);
  }
  
  // Extract dual PD if present
  const pdOdMatch = text.match(/PD OD:\s*(\d+)/);
  const pdOsMatch = text.match(/PD OS:\s*(\d+)/);
  if (pdOdMatch && pdOsMatch) {
    patientInfo.pdType = 'dual';
    patientInfo.pdOd = parseInt(pdOdMatch[1]);
    patientInfo.pdOs = parseInt(pdOsMatch[1]);
  }
  
  return patientInfo;
}
```

### Usage

To use the data import functionality:

1. Create a text file following the format shown in the User Guide
2. In the "Add Patient" form, click "Import from File"
3. Select the text file
4. The system will parse the file and populate the form fields
5. Review and adjust the extracted data as needed
6. Save the patient record

## Extending the Integrations

### Adding New Email Providers

To add a different email provider:

1. Create a new service file (e.g., `new-email-service.ts`)
2. Implement the same interface as the Mailjet service
3. Update the server endpoint to use the new provider
4. Update environment variables accordingly

### Adding New SMS Providers

To add a different SMS provider:

1. Create a new class implementing the `SmsProvider` interface
2. Update the `initSmsService` function to use the new provider
3. Update environment variables accordingly

### Adding New Data Import Formats

To support additional file formats:

1. Add new parsing functions to `data-parser.ts`
2. Implement format detection
3. Update the file input component to accept the new formats

## Troubleshooting Integration Issues

### Email Integration Issues

- **Authentication Errors**: Verify your API keys are correct
- **Sender Verification**: Ensure the sender email is verified in Mailjet
- **API Limitations**: Check if you have reached your API usage limits

### SMS Integration Issues

- **Authentication Errors**: Verify your API key is correct
- **Phone Number Format**: Ensure phone numbers include country code (e.g., +1 for US)
- **API Limitations**: Check if you have reached your API usage limits

### Data Import Issues

- **Parsing Errors**: Ensure the file follows the expected format
- **Character Encoding**: Use UTF-8 encoding for text files
- **File Size**: Keep files under 1MB for optimal performance
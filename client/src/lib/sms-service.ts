import { Patient } from '@/types';
import { formatDate, formatDiopter } from './utils';

// This interface will be used to abstract different SMS providers
export interface SmsProvider {
  sendSms(phoneNumber: string, message: string): Promise<{ success: boolean; error?: string }>;
}

// Simple MessageBird implementation
export class MessageBirdProvider implements SmsProvider {
  private apiKey: string;
  private originator: string;

  constructor(apiKey: string, originator: string = 'TheRefraction') {
    this.apiKey = apiKey;
    this.originator = originator;
  }

  async sendSms(phoneNumber: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.apiKey) {
        console.warn('MessageBird API key is not set. Simulating SMS send...');
        // Simulate a successful send for development purposes
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { success: true };
      }

      // Format the phone number to ensure it's in international format
      // Remove any non-digit characters
      const formattedNumber = phoneNumber.replace(/\D/g, '');
      
      // Format as international if it doesn't already start with +
      const internationalNumber = formattedNumber.startsWith('+') 
        ? formattedNumber 
        : `+${formattedNumber}`;

      // Import the MessageBird SDK dynamically to avoid server-side issues
      const messagebird = require('messagebird')(this.apiKey);

      return new Promise((resolve) => {
        messagebird.messages.create({
          originator: this.originator,
          recipients: [internationalNumber],
          body: message
        }, (err: any, response: any) => {
          if (err) {
            console.error('Error sending SMS:', err);
            resolve({ success: false, error: err.message || 'Failed to send SMS' });
          } else {
            console.log('SMS sent successfully:', response);
            resolve({ success: true });
          }
        });
      });
    } catch (error) {
      console.error('Error in sendSms:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Format prescription details into a text message
export const formatPrescriptionForSms = (patient: Patient): string => {
  return `Vision Prescription for ${patient.name}
    
Exam Date: ${formatDate(patient.examDate)}
    
Right Eye (OD):
SPH: ${formatDiopter(patient.rightEye.sph)}
CYL: ${formatDiopter(patient.rightEye.cyl)}
AXIS: ${patient.rightEye.axis}°
ADD: ${formatDiopter(patient.rightEye.add)}
    
Left Eye (OS):
SPH: ${formatDiopter(patient.leftEye.sph)}
CYL: ${formatDiopter(patient.leftEye.cyl)}
AXIS: ${patient.leftEye.axis}°
ADD: ${formatDiopter(patient.leftEye.add)}
    
${patient.pdType === 'single' 
  ? `PD: ${patient.pd}mm` 
  : `Right PD: ${patient.pdOd}mm, Left PD: ${patient.pdOs}mm`
}

Status: ${patient.status === 'reviewed' ? 'Reviewed by Doctor' : 'Pending Review'}

The Refraction Team
`;
};

// Create a singleton instance for the app to use
let smsProvider: SmsProvider | null = null;

export const initSmsService = () => {
  const apiKey = import.meta.env.VITE_MESSAGEBIRD_API_KEY;
  
  if (apiKey) {
    smsProvider = new MessageBirdProvider(apiKey);
  } else {
    // Create a provider that will simulate sending
    smsProvider = new MessageBirdProvider('');
    console.warn('MessageBird API key not found. SMS functionality will be simulated.');
  }
};

/**
 * Send a prescription via SMS
 */
export const sendPrescriptionSms = async (
  patient: Patient,
  recipientPhone: string,
  doctorNotes?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!smsProvider) {
      initSmsService();
    }

    if (!smsProvider) {
      throw new Error('SMS service is not initialized');
    }

    // Format the SMS message
    let smsText = formatPrescriptionForSms(patient);
    
    // Add doctor notes if provided
    if (doctorNotes && doctorNotes.trim()) {
      smsText += `\nDoctor's Notes: ${doctorNotes}\n`;
    }
    
    // Send the SMS
    return await smsProvider.sendSms(recipientPhone, smsText);
  } catch (error) {
    console.error('Error sending prescription SMS:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
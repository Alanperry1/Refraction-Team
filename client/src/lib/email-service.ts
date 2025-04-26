import emailjs from 'emailjs-com';
import { Patient } from '@/types';
import { formatDate, formatDiopter } from './utils';

// Initialize EmailJS with public key
export const initEmailJS = () => {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  
  if (publicKey) {
    emailjs.init(publicKey);
  } else {
    console.warn('EmailJS public key not found. Email functionality will be simulated.');
  }
};

/**
 * Format prescription details into a readable format
 */
export const formatPrescriptionForEmail = (patient: Patient): string => {
  return `
    <h2>Vision Prescription Details</h2>
    
    <p><strong>Patient:</strong> ${patient.name}</p>
    <p><strong>Exam Date:</strong> ${formatDate(patient.examDate)}</p>
    
    <h3>Right Eye (OD)</h3>
    <p>SPH: ${formatDiopter(patient.rightEye.sph)}</p>
    <p>CYL: ${formatDiopter(patient.rightEye.cyl)}</p>
    <p>AXIS: ${patient.rightEye.axis}°</p>
    <p>ADD: ${formatDiopter(patient.rightEye.add)}</p>
    
    <h3>Left Eye (OS)</h3>
    <p>SPH: ${formatDiopter(patient.leftEye.sph)}</p>
    <p>CYL: ${formatDiopter(patient.leftEye.cyl)}</p>
    <p>AXIS: ${patient.leftEye.axis}°</p>
    <p>ADD: ${formatDiopter(patient.leftEye.add)}</p>
    
    <h3>Pupillary Distance</h3>
    ${patient.pdType === 'single' 
      ? `<p>PD: ${patient.pd}mm</p>` 
      : `<p>Right PD: ${patient.pdOd}mm</p><p>Left PD: ${patient.pdOs}mm</p>`
    }
    
    <p><strong>Status:</strong> ${patient.status === 'reviewed' ? 'Reviewed by Doctor' : 'Pending Review'}</p>
  `;
};

/**
 * Send an email with the patient's prescription
 */
export const sendPrescriptionEmail = async (
  patient: Patient,
  recipientEmail: string,
  doctorNotes?: string,
  doctorSignature?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    
    if (!serviceId || !templateId) {
      console.warn('EmailJS credentials not found. Simulating email send...');
      // Simulate a successful send for development purposes
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true };
    }

    const prescriptionHtml = formatPrescriptionForEmail(patient);
    
    const templateParams = {
      to_email: recipientEmail,
      to_name: patient.name,
      prescription_details: prescriptionHtml,
      doctor_notes: doctorNotes || 'No additional notes provided.',
      doctor_signature: doctorSignature || 'The Refraction Team',
      subject: `Vision Prescription for ${patient.name}`,
    };

    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams
    );

    if (response.status === 200) {
      return { success: true };
    } else {
      throw new Error(`Failed to send email: ${response.text}`);
    }
  } catch (error) {
    console.error('Error sending prescription email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
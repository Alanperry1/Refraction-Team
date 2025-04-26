import { Patient } from '@/types';
import { formatDate, formatDiopter } from './utils';

/**
 * Format prescription details into a readable format
 */
export const formatPrescriptionForEmail = (patient: Patient): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.5; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { color: #2563eb; margin-bottom: 5px; }
    .patient-info { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
    .prescription { margin-bottom: 20px; }
    .eye-data { margin-bottom: 15px; }
    .eye-title { font-weight: bold; color: #2563eb; margin-bottom: 5px; }
    .measurement { display: inline-block; margin-right: 20px; margin-bottom: 10px; }
    .label { font-size: 0.8em; color: #666; display: block; }
    .value { font-weight: bold; }
    .footer { margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; font-size: 0.9em; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Vision Prescription</h1>
      <p>The Refraction Team</p>
    </div>
    
    <div class="patient-info">
      <h2>Patient Information</h2>
      <p><strong>Name:</strong> ${patient.name}</p>
      <p><strong>Date of Birth:</strong> ${formatDate(patient.dob)}</p>
      <p><strong>Exam Date:</strong> ${formatDate(patient.examDate)}</p>
      <p><strong>Status:</strong> ${patient.status === 'reviewed' ? 'Reviewed by Doctor' : 'Pending Review'}</p>
    </div>
    
    <div class="prescription">
      <h2>Prescription Details</h2>
      
      <div class="eye-data">
        <div class="eye-title">Right Eye (OD)</div>
        <div class="measurement">
          <span class="label">SPH</span>
          <span class="value">${formatDiopter(patient.rightEye.sph)}</span>
        </div>
        <div class="measurement">
          <span class="label">CYL</span>
          <span class="value">${formatDiopter(patient.rightEye.cyl)}</span>
        </div>
        <div class="measurement">
          <span class="label">AXIS</span>
          <span class="value">${patient.rightEye.axis}°</span>
        </div>
        <div class="measurement">
          <span class="label">ADD</span>
          <span class="value">${formatDiopter(patient.rightEye.add)}</span>
        </div>
      </div>
      
      <div class="eye-data">
        <div class="eye-title">Left Eye (OS)</div>
        <div class="measurement">
          <span class="label">SPH</span>
          <span class="value">${formatDiopter(patient.leftEye.sph)}</span>
        </div>
        <div class="measurement">
          <span class="label">CYL</span>
          <span class="value">${formatDiopter(patient.leftEye.cyl)}</span>
        </div>
        <div class="measurement">
          <span class="label">AXIS</span>
          <span class="value">${patient.leftEye.axis}°</span>
        </div>
        <div class="measurement">
          <span class="label">ADD</span>
          <span class="value">${formatDiopter(patient.leftEye.add)}</span>
        </div>
      </div>
      
      <div class="eye-data">
        <div class="eye-title">Pupillary Distance</div>
        ${patient.pdType === 'single' 
          ? `<div class="measurement">
               <span class="label">PD</span>
               <span class="value">${patient.pd}mm</span>
             </div>`
          : `<div class="measurement">
               <span class="label">Right PD</span>
               <span class="value">${patient.pdOd}mm</span>
             </div>
             <div class="measurement">
               <span class="label">Left PD</span>
               <span class="value">${patient.pdOs}mm</span>
             </div>`
        }
      </div>
    </div>
    
    <div class="footer">
      <p>Please contact our office if you have any questions or concerns about your prescription.</p>
      <p>This email was sent from The Refraction Dashboard.</p>
    </div>
  </div>
</body>
</html>
`;
};

/**
 * Send an email with the patient's prescription
 */
export async function sendPrescriptionEmail(
  patient: Patient,
  recipientEmail: string,
  doctorNotes?: string,
  doctorSignature?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create the API endpoint URL
    const apiUrl = '/api/email/send';
    
    // Prepare the HTML content
    let emailHtml = formatPrescriptionForEmail(patient);
    
    // Add doctor notes if provided
    if (doctorNotes && doctorNotes.trim()) {
      emailHtml = emailHtml.replace('</div>\n    \n    <div class="footer">', 
        `</div>\n    
    <div class="doctor-notes" style="margin-bottom: 20px; border: 1px solid #eee; padding: 15px; background-color: #f9f9f9;">
      <h2>Doctor's Notes</h2>
      <p style="white-space: pre-line;">${doctorNotes}</p>
      ${doctorSignature ? `<p style="text-align: right; margin-top: 15px;"><strong>${doctorSignature}</strong></p>` : ''}
    </div>\n    
    <div class="footer">`);
    }
    
    // Create the request data
    const requestData = {
      to: recipientEmail,
      subject: `Vision Prescription for ${patient.name}`,
      html: emailHtml,
      patientName: patient.name
    };
    
    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    // Check if the request was successful
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send email');
    }
    
    // Return success
    return { success: true };
  } catch (error) {
    console.error('Error sending prescription email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email'
    };
  }
}
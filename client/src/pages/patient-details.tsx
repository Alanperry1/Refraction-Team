import { useState, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Patient } from "@/types";
import { formatDate, formatPhoneNumber } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PrescriptionDisplay from "@/components/shared/prescription-display";

export default function PatientDetails() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const [emailProgress, setEmailProgress] = useState(0);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  const [emailError, setEmailError] = useState("");
  const detailsRef = useRef<HTMLDivElement>(null);
  
  // Fetch patient details
  const { data: patient, isLoading, error } = useQuery<Patient>({
    queryKey: [`/api/patients/${params.id}`]
  });
  
  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/patients/${params.id}/status`, { status: "reviewed" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${params.id}`] });
      toast({
        title: "Status updated",
        description: "The patient's status has been updated to reviewed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Print the prescription
  const printDetails = () => {
    const printContent = detailsRef.current?.innerHTML;
    
    if (printContent) {
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Patient Prescription - ${patient?.name}</title>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
              <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">
              <style>
                body {
                  font-family: 'Inter', sans-serif;
                  line-height: 1.5;
                  color: #333;
                  padding: 20px;
                }
                .prescription-header {
                  display: flex;
                  justify-content: space-between;
                  border-bottom: 2px solid #ddd;
                  padding-bottom: 15px;
                  margin-bottom: 20px;
                }
                .prescription-title {
                  font-size: 24px;
                  font-weight: bold;
                  color: #1976D2;
                }
                .company-info {
                  text-align: right;
                  font-size: 12px;
                  color: #666;
                }
                .patient-info {
                  background-color: #f9f9f9;
                  padding: 15px;
                  border-radius: 8px;
                  margin-bottom: 20px;
                }
                .patient-info-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                  gap: 15px;
                }
                .info-item label {
                  display: block;
                  font-size: 12px;
                  color: #666;
                  margin-bottom: 3px;
                }
                .info-item p {
                  margin: 0;
                  font-weight: 500;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 20px;
                }
                th, td {
                  padding: 10px;
                  text-align: left;
                  border: 1px solid #ddd;
                }
                th {
                  background-color: #f2f2f2;
                  font-weight: 600;
                  font-size: 12px;
                  text-transform: uppercase;
                }
                .eye-icon {
                  display: inline-block;
                  width: 16px;
                  height: 16px;
                  margin-right: 5px;
                  background-color: #ddd;
                  border-radius: 50%;
                  text-align: center;
                  line-height: 16px;
                  font-size: 10px;
                }
                .pd-info {
                  margin-top: 20px;
                  padding: 15px;
                  background-color: #f9f9f9;
                  border-radius: 8px;
                }
                .notes {
                  margin-top: 20px;
                  padding: 15px;
                  background-color: #fff8e1;
                  border-radius: 8px;
                  border: 1px solid #ffe082;
                  font-size: 12px;
                }
                .signature {
                  margin-top: 50px;
                  display: flex;
                  justify-content: space-between;
                }
                .signature-line {
                  width: 150px;
                  border-bottom: 1px solid #999;
                  padding-bottom: 5px;
                }
                .signature-label {
                  font-size: 12px;
                  color: #666;
                  margin-top: 5px;
                }
              </style>
            </head>
            <body>
              <div class="prescription-header">
                <div>
                  <div class="prescription-title">OptiPrescribe</div>
                  <div>Professional Vision Care</div>
                </div>
                <div class="company-info">
                  <div>123 Vision Street</div>
                  <div>Optics City, OC 12345</div>
                  <div>Tel: (555) 123-4567</div>
                </div>
              </div>
              ${printContent}
              <div class="signature">
                <div>
                  <div class="signature-line"></div>
                  <div class="signature-label">Date</div>
                </div>
                <div>
                  <div class="signature-line"></div>
                  <div class="signature-label">Doctor's Signature</div>
                </div>
              </div>
            </body>
          </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        
        // Mark as reviewed when printed
        if (patient?.status !== "reviewed") {
          updateStatusMutation.mutate();
        }
      }
    }
  };
  
  // Send prescription via email
  const sendEmail = async () => {
    if (!patient) return;
    
    try {
      setIsSendingEmail(true);
      setEmailProgress(0);
      setEmailStatus("Preparing email...");
      setEmailError("");
      
      // Convert the prescription to PDF using html2pdf
      const element = detailsRef.current;
      if (!element) {
        throw new Error("Cannot find prescription element");
      }
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setEmailProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 300);
      
      setEmailStatus("Sending email...");
      
      // Use EmailJS to send the email
      // Initialize the EmailJS library (should be done in main.tsx)
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_8w0bht4";
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_bkr29b6";
      
      const patientName = patient.name;
      const patientEmail = patient.email;
      const examDate = formatDate(patient.examDate);
      
      // Prepare prescription text for email
      const prescriptionDetails = `
        Right Eye (OD):
        - SPH: ${patient.rightEye.sph}
        - CYL: ${patient.rightEye.cyl}
        - AXIS: ${patient.rightEye.axis}
        - ADD: ${patient.rightEye.add}
        
        Left Eye (OS):
        - SPH: ${patient.leftEye.sph}
        - CYL: ${patient.leftEye.cyl}
        - AXIS: ${patient.leftEye.axis}
        - ADD: ${patient.leftEye.add}
        
        ${patient.pdType === "single" 
          ? `Pupillary Distance: ${patient.pd} mm` 
          : `Pupillary Distance: Right: ${patient.pdOd} mm, Left: ${patient.pdOs} mm`
        }
      `;
      
      // Send the email using EmailJS
      await (window as any).emailjs.send(serviceId, templateId, {
        to_name: patientName,
        to_email: patientEmail,
        prescription_details: prescriptionDetails,
        exam_date: examDate,
      });
      
      clearInterval(progressInterval);
      setEmailProgress(100);
      setEmailStatus("Email sent successfully!");
      
      // Mark as reviewed when emailed
      if (patient?.status !== "reviewed") {
        updateStatusMutation.mutate();
      }
      
      toast({
        title: "Email Sent",
        description: `Prescription has been sent to ${patientEmail}.`
      });
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setIsSendingEmail(false);
        setEmailStatus("");
        setEmailProgress(0);
      }, 3000);
      
    } catch (error) {
      setEmailError(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setEmailStatus("");
      setEmailProgress(0);
      
      toast({
        title: "Email Error",
        description: error instanceof Error ? error.message : "Failed to send email",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-blue-100 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-center p-8">
              <i className="ri-loader-4-line animate-spin text-4xl text-primary-500"></i>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error || !patient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-blue-100 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-6">
            <div className="text-center p-8">
              <div className="text-red-500 mb-4">
                <i className="ri-error-warning-line text-4xl"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">Error Loading Patient</h3>
              <p className="text-gray-600 mb-4">
                {error instanceof Error ? error.message : "Could not load patient details."}
              </p>
              <Button onClick={() => setLocation('/patients')}>
                Back to Patient Records
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800">Patient Prescription Details</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation('/patients')}
                className="print:hidden"
              >
                <i className="ri-close-line text-xl"></i>
              </Button>
            </div>
          </div>
          
          <div className="print:block print:p-0 print:shadow-none" ref={detailsRef}>
            {/* Patient Information */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-3">Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-base font-medium text-gray-900">{patient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="text-base font-medium text-gray-900">
                    {formatDate(patient.dob)} ({patient.age} years)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-base font-medium text-gray-900">{formatPhoneNumber(patient.phone)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-base font-medium text-gray-900">{patient.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="text-base font-medium text-gray-900">{patient.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Examination Date</p>
                  <p className="text-base font-medium text-gray-900">{formatDate(patient.examDate)}</p>
                </div>
              </div>
            </div>
            
            {/* Prescription display component */}
            <PrescriptionDisplay patient={patient} />
            
            {/* Notes and Recommendations */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-2">Notes and Recommendations</h3>
              <p className="text-sm text-gray-700">
                This prescription is valid for one year from the examination date. 
                Please bring this prescription with you when ordering eyeglasses or contact lenses.
              </p>
              <div className="mt-3 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <i className="ri-information-line text-yellow-700"></i>
                  </div>
                  <div className="ml-2">
                    <p className="text-xs text-yellow-700">
                      High-index lenses recommended for this prescription. 
                      UV protection coating advised for outdoor activities.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Email Progress */}
          {isSendingEmail && (
            <>
              <div className="w-full h-5 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-primary-500 transition-all duration-300" 
                  style={{ width: `${emailProgress}%` }}
                ></div>
              </div>
              <div className="text-center text-sm text-gray-600 mb-4">{emailStatus}</div>
            </>
          )}
          
          {emailError && (
            <div className="text-center text-sm text-red-600 mb-4">{emailError}</div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between mt-6 space-y-3 sm:space-y-0 print:hidden">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/patients')}
            >
              <i className="ri-arrow-left-line mr-2"></i>
              Back to Records
            </Button>
            <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={printDetails}
              >
                <i className="ri-printer-line mr-2"></i>
                Print Prescription
              </Button>
              <Button 
                onClick={sendEmail}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? (
                  <span className="flex items-center">
                    <i className="ri-loader-4-line animate-spin mr-2"></i> Sending...
                  </span>
                ) : (
                  <>
                    <i className="ri-mail-send-line mr-2"></i>
                    Send via Email
                  </>
                )}
              </Button>
              <Button 
                variant="secondary"
                onClick={() => setLocation(`/doctor/review/${params.id}`)}
              >
                <i className="ri-stethoscope-line mr-2"></i>
                Doctor Review
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

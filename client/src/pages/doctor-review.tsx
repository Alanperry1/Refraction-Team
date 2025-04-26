import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatDiopter, calculateAge } from "@/lib/utils";
import { Patient } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { initEmailJS, sendPrescriptionEmail } from "@/lib/email-service";
import { Input } from "@/components/ui/input";
import html2pdf from "html2pdf.js";
import { Check, Loader2, Mail, ArrowLeft, Download, FileText } from "lucide-react";

// Initialize EmailJS
initEmailJS();

export default function DoctorReview() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [doctorNotes, setDoctorNotes] = useState("");
  const [doctorSignature, setDoctorSignature] = useState("");
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const patientId = parseInt(id || "0");

  // Fetch patient details
  const { data: patient, isLoading, isError } = useQuery({
    queryKey: [`/api/patients/${patientId}`],
    enabled: patientId > 0,
  });

  // Set default email recipient when patient data is loaded
  useEffect(() => {
    if (patient?.email) {
      setEmailRecipient(patient.email);
    }
  }, [patient]);

  // Handle marking prescription as reviewed
  const markReviewedMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/patients/${patientId}/status`, { status: "reviewed" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}`] });
      toast({
        title: "Prescription Reviewed",
        description: "The patient's prescription has been marked as reviewed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to mark as reviewed: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle generating PDF of prescription
  const generatePdf = () => {
    if (!patient) return;

    const prescriptionElement = document.getElementById("prescription-content");
    if (!prescriptionElement) return;

    const options = {
      margin: 10,
      filename: `prescription_${patient.name.replace(/\s+/g, "_")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
    };

    html2pdf().set(options).from(prescriptionElement).save();
  };

  // Handle sending email with prescription
  const handleSendEmail = async () => {
    if (!patient) return;

    setSendingEmail(true);
    
    try {
      const result = await sendPrescriptionEmail(
        patient,
        emailRecipient,
        doctorNotes,
        doctorSignature
      );

      if (result.success) {
        toast({
          title: "Email Sent",
          description: "The prescription email has been sent successfully.",
        });
        setShowEmailDialog(false);
      } else {
        throw new Error(result.error || "Failed to send email");
      }
    } catch (error) {
      toast({
        title: "Email Error",
        description: error instanceof Error ? error.message : "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  // Generate clinical recommendations
  const generateRecommendations = async () => {
    if (!patient) return;

    setIsLoadingAI(true);
    
    try {
      const { generateRecommendation } = await import("@/types/recommendations");
      const recommendation = await generateRecommendation({ patient });
      setAiRecommendation(recommendation);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate clinical recommendations",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-100 to-blue-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-lg font-medium">Loading patient data...</span>
        </div>
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-100 to-blue-50 flex flex-col items-center justify-center">
        <p className="text-lg font-medium mb-4">Error loading patient data</p>
        <Button onClick={() => setLocation("/")}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-blue-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/dashboard")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Doctor Review Console</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prescription Display */}
          <div>
            <Card>
              <CardContent className="p-6">
                <div id="prescription-content" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-primary">Patient Prescription</h2>
                    <div className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm">
                      {patient.status === "reviewed" ? (
                        <span className="flex items-center">
                          <Check className="h-4 w-4 mr-1 text-green-500" />
                          Reviewed
                        </span>
                      ) : (
                        <span>Pending Review</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">Patient Name</p>
                      <p>{patient.name}</p>
                    </div>
                    <div>
                      <p className="font-medium">Exam Date</p>
                      <p>{formatDate(patient.examDate)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Date of Birth</p>
                      <p>{formatDate(patient.dob)} (Age: {calculateAge(patient.dob)})</p>
                    </div>
                    <div>
                      <p className="font-medium">Contact</p>
                      <p>{patient.phone}</p>
                      <p>{patient.email}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-bold mb-3">Prescription Details</h3>
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-primary">Right Eye (OD)</h4>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-500">SPH</p>
                          <p className="font-medium">{formatDiopter(patient.rightEye.sph)}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-500">CYL</p>
                          <p className="font-medium">{formatDiopter(patient.rightEye.cyl)}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-500">AXIS</p>
                          <p className="font-medium">{patient.rightEye.axis}°</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-500">ADD</p>
                          <p className="font-medium">{formatDiopter(patient.rightEye.add)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-primary">Left Eye (OS)</h4>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-500">SPH</p>
                          <p className="font-medium">{formatDiopter(patient.leftEye.sph)}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-500">CYL</p>
                          <p className="font-medium">{formatDiopter(patient.leftEye.cyl)}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-500">AXIS</p>
                          <p className="font-medium">{patient.leftEye.axis}°</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-500">ADD</p>
                          <p className="font-medium">{formatDiopter(patient.leftEye.add)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-primary">Pupillary Distance</h4>
                      {patient.pdType === "single" ? (
                        <div className="bg-gray-50 p-2 rounded mt-2 inline-block">
                          <p className="text-xs text-gray-500">PD</p>
                          <p className="font-medium">{patient.pd}mm</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="text-xs text-gray-500">Right PD</p>
                            <p className="font-medium">{patient.pdOd}mm</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="text-xs text-gray-500">Left PD</p>
                            <p className="font-medium">{patient.pdOs}mm</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {doctorNotes && (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="font-medium">Doctor's Notes</h4>
                        <p className="whitespace-pre-line text-sm mt-1">{doctorNotes}</p>
                      </div>
                    )}

                    {doctorSignature && (
                      <div className="mt-4">
                        <p className="mt-6 text-right font-medium">{doctorSignature}</p>
                        <p className="text-right text-sm text-gray-500">
                          {formatDate(new Date().toISOString().split('T')[0])}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-2 mt-4">
              <Button onClick={generatePdf}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={() => setShowEmailDialog(true)}>
                <Mail className="h-4 w-4 mr-2" />
                Send via Email
              </Button>
              {patient.status !== "reviewed" && (
                <Button 
                  variant="secondary" 
                  onClick={() => markReviewedMutation.mutate()}
                  disabled={markReviewedMutation.isPending}
                >
                  {markReviewedMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Mark as Reviewed
                </Button>
              )}
            </div>
          </div>

          {/* Doctor's Tools */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Doctor's Notes</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="doctor-notes">Clinical Notes & Recommendations</Label>
                    <Textarea
                      id="doctor-notes"
                      placeholder="Enter your clinical observations and recommendations..."
                      rows={6}
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="doctor-signature">Doctor's Signature</Label>
                    <Input
                      id="doctor-signature"
                      placeholder="Dr. [Your Name]"
                      value={doctorSignature}
                      onChange={(e) => setDoctorSignature(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Clinical Recommendations</h2>
                  <Button 
                    variant="outline" 
                    onClick={generateRecommendations} 
                    disabled={isLoadingAI}
                  >
                    {isLoadingAI ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Generate
                  </Button>
                </div>
                
                {isLoadingAI ? (
                  <div className="bg-gray-50 p-4 rounded flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Analyzing prescription data...</span>
                  </div>
                ) : aiRecommendation ? (
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-medium text-primary mb-2">Prescription Analysis</h3>
                    <div className="whitespace-pre-line text-sm">{aiRecommendation}</div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="mt-2"
                      onClick={() => setDoctorNotes(prev => 
                        prev ? `${prev}\n\n--- CLINICAL RECOMMENDATIONS ---\n${aiRecommendation}` : 
                        `CLINICAL RECOMMENDATIONS:\n${aiRecommendation}`
                      )}
                    >
                      Add to Notes
                    </Button>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded text-center text-gray-500">
                    Click "Generate" to get professional clinical recommendations based on this prescription
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Prescription via Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="email-recipient">Recipient Email</Label>
              <Input
                id="email-recipient"
                type="email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="patient@example.com"
              />
            </div>
            <div>
              <Label>Email Contents</Label>
              <div className="mt-2 bg-gray-50 p-3 rounded-md text-sm">
                <p><strong>From:</strong> therefractionteam@gmail.com</p>
                <p><strong>Subject:</strong> Vision Prescription for {patient.name}</p>
                <p className="mt-2"><strong>Includes:</strong></p>
                <ul className="list-disc list-inside ml-2">
                  <li>Patient prescription details</li>
                  <li>Doctor's notes (if provided)</li>
                  <li>Doctor's signature (if provided)</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEmailDialog(false)}
              disabled={sendingEmail}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail}
              disabled={!emailRecipient || sendingEmail}
            >
              {sendingEmail ? (
                <span className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </span>
              ) : (
                <span className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
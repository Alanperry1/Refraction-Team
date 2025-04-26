import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { InsertPatient, PatientFormData } from "@/types";
import { calculateAge } from "@/lib/utils";
import { parsePatientFile } from "@/lib/data-parser";

export default function PatientForm() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const isEditMode = Boolean(params.id);
  
  const initialFormData: PatientFormData = {
    name: "",
    phone: "",
    email: "",
    location: "",
    dob: "",
    age: 0,
    examDate: new Date().toISOString().split('T')[0],
    rightEye: {
      sph: 0,
      cyl: 0,
      axis: 0,
      add: 0
    },
    leftEye: {
      sph: 0,
      cyl: 0,
      axis: 0,
      add: 0
    },
    pdType: "single",
    pd: 0
  };
  
  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [age, setAge] = useState<number | null>(null);
  
  // Fetch patient data if in edit mode
  const { data: patientData, isLoading } = useQuery({
    queryKey: [isEditMode ? `/api/patients/${params.id}` : null],
    enabled: isEditMode
  });
  
  // Set form data when patient data is loaded
  useEffect(() => {
    if (patientData) {
      setFormData(patientData);
      if (patientData.dob) {
        setAge(calculateAge(patientData.dob));
      }
    }
  }, [patientData]);
  
  // Update age when date of birth changes
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = e.target.value;
    setFormData({ ...formData, dob });
    
    if (dob) {
      const calculatedAge = calculateAge(dob);
      setAge(calculatedAge);
    } else {
      setAge(null);
    }
  };
  
  // Handle form submission
  const saveMutation = useMutation({
    mutationFn: async (data: InsertPatient) => {
      if (isEditMode) {
        return apiRequest("PATCH", `/api/patients/${params.id}`, data);
      } else {
        return apiRequest("POST", "/api/patients", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: `Patient ${isEditMode ? "updated" : "created"} successfully!`,
        description: `The patient record has been ${isEditMode ? "updated" : "saved"}.`,
      });
      setLocation("/patients");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? "update" : "save"} patient: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.phone || !formData.email || !formData.dob || !formData.examDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare data for submission
    const patientData: InsertPatient = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      location: formData.location,
      dob: formData.dob,
      examDate: formData.examDate,
      rightEye: formData.rightEye,
      leftEye: formData.leftEye,
      pdType: formData.pdType,
      ...(formData.pdType === "single" ? { pd: formData.pd } : { pdOd: formData.pdOd, pdOs: formData.pdOs })
    };
    
    saveMutation.mutate(patientData);
  };
  
  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      toast({
        title: "Processing file",
        description: "Extracting patient data from the uploaded file...",
      });
      
      const extractedData = await parsePatientFile(file);
      
      // Merge extracted data with current form data
      setFormData(prev => ({
        ...prev,
        ...extractedData,
        // Keep the original values if they are already set and extracted data doesn't have them
        rightEye: {
          ...prev.rightEye,
          ...extractedData.rightEye
        },
        leftEye: {
          ...prev.leftEye,
          ...extractedData.leftEye
        }
      }));
      
      // Update age if DOB was extracted
      if (extractedData.dob) {
        setAge(calculateAge(extractedData.dob));
      }
      
      toast({
        title: "Data extracted successfully",
        description: "The patient data has been extracted from the file.",
      });
    } catch (error) {
      toast({
        title: "Error processing file",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };
  
  // Copy prescription data between eyes
  const copyToOtherEye = (source: 'od' | 'os') => {
    if (source === 'od') {
      // Copy from right eye to left eye
      setFormData({
        ...formData,
        leftEye: { ...formData.rightEye }
      });
    } else {
      // Copy from left eye to right eye
      setFormData({
        ...formData,
        rightEye: { ...formData.leftEye }
      });
    }
  };
  
  if (isLoading && isEditMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-blue-100 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-5xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-center p-8">
              <i className="ri-loader-4-line animate-spin text-4xl text-primary-500"></i>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-5xl mx-auto">
        <CardContent className="p-6">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800">
                {isEditMode ? "Edit Patient Prescription" : "New Patient Prescription"}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard')}>
                <i className="ri-close-line text-xl"></i>
              </Button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Import Section */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Import Patient Data</h3>
              <div className="flex flex-col md:flex-row items-start">
                <div className="flex-grow w-full md:w-auto">
                  <Label htmlFor="patientFile" className="block text-sm font-medium text-gray-700 mb-1">
                    Upload file with patient data
                  </Label>
                  <div className="mt-1 flex items-center">
                    <Label className="w-full flex items-center px-4 py-2 bg-white text-sm font-medium text-gray-700 border border-gray-300 rounded-md shadow-sm cursor-pointer hover:bg-gray-50">
                      <i className="ri-upload-2-line mr-2 text-gray-400"></i>
                      <span className="truncate">Choose file</span>
                      <Input 
                        id="patientFile" 
                        type="file" 
                        className="sr-only" 
                        accept=".pdf,.docx,.txt" 
                        onChange={handleFileUpload}
                      />
                    </Label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Supported formats: PDF, Word document, or Text file</p>
                </div>
                <div className="ml-0 md:ml-4 mt-4 md:mt-0 w-full md:w-auto">
                  <div className="bg-blue-50 p-3 rounded-md">
                    <div className="flex items-start">
                      <i className="ri-information-line text-blue-500 mr-2 mt-1"></i>
                      <div>
                        <p className="text-xs text-blue-700 mb-1">Patient data will be automatically extracted from the uploaded file.</p>
                        <details className="text-xs text-blue-700">
                          <summary className="cursor-pointer font-medium">View sample text format</summary>
                          <pre className="mt-1 p-2 bg-blue-100 rounded whitespace-pre-wrap text-[10px] leading-tight">
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
                          </pre>
                        </details>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Patient Information */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    placeholder="John Doe" 
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                    placeholder="+1 (555) 123-4567" 
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    placeholder="patient@example.com" 
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    value={formData.location} 
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                    placeholder="City, State" 
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input 
                    id="dob" 
                    type="date" 
                    value={formData.dob} 
                    onChange={handleDobChange} 
                    required 
                  />
                  {age !== null && (
                    <div className="mt-1 text-sm text-gray-500">{age} years old</div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="exam">Date of Examination</Label>
                  <Input 
                    id="exam" 
                    type="date" 
                    value={formData.examDate} 
                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })} 
                    required 
                  />
                </div>
              </div>
            </div>
            
            {/* Prescription Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Right Eye (OD) */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <i className="ri-eye-line text-blue-600"></i>
                  </div>
                  <h3 className="ml-2 text-lg font-medium text-gray-900">Right Eye (OD)</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="od-sph">Sphere (SPH)</Label>
                    <div className="flex rounded-md">
                      <Input 
                        id="od-sph" 
                        type="number"
                        step="0.25" 
                        value={formData.rightEye.sph} 
                        onChange={(e) => setFormData({
                          ...formData,
                          rightEye: {
                            ...formData.rightEye,
                            sph: parseFloat(e.target.value) || 0
                          }
                        })} 
                        placeholder="-2.50" 
                        required 
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        diopters
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="od-cyl">Cylinder (CYL)</Label>
                    <div className="flex rounded-md">
                      <Input 
                        id="od-cyl" 
                        type="number"
                        step="0.25" 
                        value={formData.rightEye.cyl} 
                        onChange={(e) => setFormData({
                          ...formData,
                          rightEye: {
                            ...formData.rightEye,
                            cyl: parseFloat(e.target.value) || 0
                          }
                        })} 
                        placeholder="+0.75" 
                        required 
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        diopters
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="od-axis">Axis</Label>
                    <div className="flex rounded-md">
                      <Input 
                        id="od-axis" 
                        type="number"
                        min="0"
                        max="180"
                        value={formData.rightEye.axis} 
                        onChange={(e) => setFormData({
                          ...formData,
                          rightEye: {
                            ...formData.rightEye,
                            axis: parseInt(e.target.value) || 0
                          }
                        })} 
                        placeholder="180" 
                        required 
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        degrees
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="od-add">Add</Label>
                    <div className="flex rounded-md">
                      <Input 
                        id="od-add" 
                        type="number"
                        step="0.25" 
                        value={formData.rightEye.add} 
                        onChange={(e) => setFormData({
                          ...formData,
                          rightEye: {
                            ...formData.rightEye,
                            add: parseFloat(e.target.value) || 0
                          }
                        })} 
                        placeholder="+3.00" 
                        required 
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        diopters
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => copyToOtherEye('od')}
                  >
                    <i className="ri-arrow-right-line mr-2"></i>
                    Copy to Left Eye
                  </Button>
                </div>
              </div>
              
              {/* Left Eye (OS) */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <i className="ri-eye-line text-green-600"></i>
                  </div>
                  <h3 className="ml-2 text-lg font-medium text-gray-900">Left Eye (OS)</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="os-sph">Sphere (SPH)</Label>
                    <div className="flex rounded-md">
                      <Input 
                        id="os-sph" 
                        type="number"
                        step="0.25" 
                        value={formData.leftEye.sph} 
                        onChange={(e) => setFormData({
                          ...formData,
                          leftEye: {
                            ...formData.leftEye,
                            sph: parseFloat(e.target.value) || 0
                          }
                        })} 
                        placeholder="+2.75" 
                        required 
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        diopters
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="os-cyl">Cylinder (CYL)</Label>
                    <div className="flex rounded-md">
                      <Input 
                        id="os-cyl" 
                        type="number"
                        step="0.25" 
                        value={formData.leftEye.cyl} 
                        onChange={(e) => setFormData({
                          ...formData,
                          leftEye: {
                            ...formData.leftEye,
                            cyl: parseFloat(e.target.value) || 0
                          }
                        })} 
                        placeholder="-0.50" 
                        required 
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        diopters
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="os-axis">Axis</Label>
                    <div className="flex rounded-md">
                      <Input 
                        id="os-axis" 
                        type="number"
                        min="0"
                        max="180"
                        value={formData.leftEye.axis} 
                        onChange={(e) => setFormData({
                          ...formData,
                          leftEye: {
                            ...formData.leftEye,
                            axis: parseInt(e.target.value) || 0
                          }
                        })} 
                        placeholder="170" 
                        required 
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        degrees
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="os-add">Add</Label>
                    <div className="flex rounded-md">
                      <Input 
                        id="os-add" 
                        type="number"
                        step="0.25" 
                        value={formData.leftEye.add} 
                        onChange={(e) => setFormData({
                          ...formData,
                          leftEye: {
                            ...formData.leftEye,
                            add: parseFloat(e.target.value) || 0
                          }
                        })} 
                        placeholder="+2.00" 
                        required 
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        diopters
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => copyToOtherEye('os')}
                  >
                    <i className="ri-arrow-left-line mr-2"></i>
                    Copy to Right Eye
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Pupillary Distance */}
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Pupillary Distance (PD)</h3>
                
                <RadioGroup 
                  value={formData.pdType} 
                  onValueChange={(value) => setFormData({ ...formData, pdType: value as "single" | "dual" })}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="single" id="pd-type-single" />
                    <Label htmlFor="pd-type-single">Single PD Measurement</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dual" id="pd-type-dual" />
                    <Label htmlFor="pd-type-dual">Dual PD Measurement (Separate for each eye)</Label>
                  </div>
                </RadioGroup>
                
                {formData.pdType === "single" ? (
                  <div className="mt-4">
                    <Label htmlFor="pd">Pupillary Distance</Label>
                    <div className="flex rounded-md">
                      <Input 
                        id="pd" 
                        type="number"
                        step="0.5" 
                        value={formData.pd} 
                        onChange={(e) => setFormData({
                          ...formData,
                          pd: parseFloat(e.target.value) || 0
                        })} 
                        placeholder="64" 
                        required={formData.pdType === "single"} 
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        mm
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pd-od">Right Eye PD</Label>
                      <div className="flex rounded-md">
                        <Input 
                          id="pd-od" 
                          type="number"
                          step="0.5" 
                          value={formData.pdOd} 
                          onChange={(e) => setFormData({
                            ...formData,
                            pdOd: parseFloat(e.target.value) || 0
                          })} 
                          placeholder="32.5" 
                          required={formData.pdType === "dual"} 
                        />
                        <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          mm
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="pd-os">Left Eye PD</Label>
                      <div className="flex rounded-md">
                        <Input 
                          id="pd-os" 
                          type="number"
                          step="0.5" 
                          value={formData.pdOs} 
                          onChange={(e) => setFormData({
                            ...formData,
                            pdOs: parseFloat(e.target.value) || 0
                          })} 
                          placeholder="31.5" 
                          required={formData.pdType === "dual"} 
                        />
                        <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          mm
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between space-y-3 space-y-reverse sm:space-y-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setLocation('/')}
              >
                <i className="ri-arrow-left-line mr-2"></i>
                Back to Dashboard
              </Button>
              <Button 
                type="submit" 
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <span className="flex items-center">
                    <i className="ri-loader-4-line animate-spin mr-2"></i> 
                    {isEditMode ? "Updating..." : "Saving..."}
                  </span>
                ) : (
                  <>
                    <i className="ri-save-line mr-2"></i>
                    {isEditMode ? "Update Patient" : "Save Patient"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

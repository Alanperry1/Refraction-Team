import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Patient } from "@/types";
import { getInitials, stringToColor, formatDate } from "@/lib/utils";
import DeleteConfirmDialog from "@/components/shared/delete-confirm-dialog";
import EditConfirmDialog from "@/components/shared/edit-confirm-dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PatientRecords() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Fetch patients
  const { data: patients, isLoading, error } = useQuery<Patient[]>({
    queryKey: ["/api/patients"]
  });
  
  // Delete patient mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/patients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Patient deleted",
        description: "The patient record has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete patient: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Filter patients based on search term
  const filteredPatients = patients?.filter(patient => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.name.toLowerCase().includes(searchLower) ||
      patient.email.toLowerCase().includes(searchLower) ||
      patient.phone.toLowerCase().includes(searchLower) ||
      patient.location.toLowerCase().includes(searchLower)
    );
  });
  
  // Handle view details
  const viewDetails = (patient: Patient) => {
    setLocation(`/patient/${patient.id}`);
  };
  
  // Handle edit patient
  const initiateEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditDialogOpen(true);
  };
  
  // Handle delete patient
  const initiateDelete = (patient: Patient) => {
    setSelectedPatient(patient);
    setDeleteDialogOpen(true);
  };
  
  // Confirm delete with PIN
  const handleConfirmDelete = (pin: string) => {
    if (pin === "1234") { // Demo PIN, this should be more secure in production
      if (selectedPatient) {
        deleteMutation.mutate(selectedPatient.id);
      }
      setDeleteDialogOpen(false);
      setSelectedPatient(null);
    } else {
      toast({
        title: "Invalid PIN",
        description: "The security PIN you entered is incorrect.",
        variant: "destructive",
      });
    }
  };
  
  // Confirm edit with PIN
  const handleConfirmEdit = (pin: string) => {
    if (pin === "1234") { // Demo PIN, this should be more secure in production
      if (selectedPatient) {
        setLocation(`/patient/edit/${selectedPatient.id}`);
      }
      setEditDialogOpen(false);
      setSelectedPatient(null);
    } else {
      toast({
        title: "Invalid PIN",
        description: "The security PIN you entered is incorrect.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-5xl mx-auto">
        <CardContent className="p-6">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800">Patient Records</h2>
              <Button variant="ghost" size="sm" onClick={() => setLocation('/')}>
                <i className="ri-close-line text-xl"></i>
              </Button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="ri-search-line text-gray-400"></i>
              </div>
              <Input 
                type="text" 
                placeholder="Search patient records..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <i className="ri-loader-4-line animate-spin text-3xl text-primary-500"></i>
            </div>
          )}
          
          {/* Error state */}
          {error && (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">
                <i className="ri-error-warning-line text-4xl"></i>
              </div>
              <p className="text-gray-700">Failed to load patient records.</p>
              <Button 
                className="mt-4" 
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/patients"] })}
              >
                Try Again
              </Button>
            </div>
          )}
          
          {/* Empty state */}
          {!isLoading && !error && filteredPatients?.length === 0 && (
            <div className="text-center py-8">
              {searchTerm ? (
                <>
                  <div className="text-gray-500 mb-2">
                    <i className="ri-search-line text-4xl"></i>
                  </div>
                  <p className="text-gray-700">No patients found matching "{searchTerm}".</p>
                  <Button 
                    className="mt-4" 
                    variant="outline"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-gray-500 mb-2">
                    <i className="ri-folder-user-line text-4xl"></i>
                  </div>
                  <p className="text-gray-700">No patient records found.</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setLocation('/patient/new')}
                  >
                    Add Your First Patient
                  </Button>
                </>
              )}
            </div>
          )}
          
          {/* Records Table */}
          {!isLoading && !error && filteredPatients && filteredPatients.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: stringToColor(patient.name) }}
                          >
                            <span className="text-gray-700 font-medium text-sm">{getInitials(patient.name)}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                            <div className="text-sm text-gray-500">{patient.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(patient.examDate)}</div>
                        <div className="text-sm text-gray-500">{patient.age} years old</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          patient.status === 'reviewed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {patient.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <button 
                            className="text-primary-600 hover:text-primary-800 focus:outline-none" 
                            onClick={() => viewDetails(patient)}
                          >
                            <i className="ri-eye-line text-lg"></i>
                          </button>
                          <button 
                            className="text-yellow-600 hover:text-yellow-800 focus:outline-none" 
                            onClick={() => initiateEdit(patient)}
                          >
                            <i className="ri-edit-line text-lg"></i>
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-800 focus:outline-none" 
                            onClick={() => initiateDelete(patient)}
                          >
                            <i className="ri-delete-bin-line text-lg"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between mt-6 space-y-3 sm:space-y-0">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/')}
            >
              <i className="ri-arrow-left-line mr-2"></i>
              Back to Dashboard
            </Button>
            <Button 
              onClick={() => setLocation('/patient/new')}
            >
              <i className="ri-add-line mr-2"></i>
              Add New Patient
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Confirmation dialogs */}
      <DeleteConfirmDialog 
        isOpen={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)} 
        onConfirm={handleConfirmDelete}
        patientName={selectedPatient?.name}
      />
      
      <EditConfirmDialog 
        isOpen={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)} 
        onConfirm={handleConfirmEdit}
        patientName={selectedPatient?.name}
      />
    </div>
  );
}

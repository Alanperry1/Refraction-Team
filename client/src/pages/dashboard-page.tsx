import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-r from-blue-100 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-4xl">
        <CardContent className="p-8">
          <div className="text-center border-b border-gray-200 pb-5 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Optical Prescription Dashboard</h2>
            <p className="mt-1 text-sm text-gray-500">Manage patient records and prescriptions</p>
            {user && (
              <div className="mt-2 text-sm text-gray-500">
                Logged in as <span className="font-medium">{user.username}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-3" 
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? "Logging out..." : "Logout"}
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-6 text-center flex flex-col items-center">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary-100 text-primary-600 mb-4">
                <i className="ri-user-add-line text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Create New Patient</h3>
              <p className="mt-2 text-sm text-gray-600">Add a new patient record with prescription details</p>
              <Button 
                className="mt-5" 
                onClick={() => setLocation('/patient/new')}
              >
                <i className="ri-add-line mr-2"></i>
                New Patient
              </Button>
            </div>
            
            <div className="bg-green-50 rounded-lg p-6 text-center flex flex-col items-center">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-secondary-100 text-secondary-600 mb-4">
                <i className="ri-folder-user-line text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900">View Patient Records</h3>
              <p className="mt-2 text-sm text-gray-600">Access and manage existing patient prescriptions</p>
              <Button 
                className="mt-5 bg-green-600 hover:bg-green-700"
                onClick={() => setLocation('/patients')}
              >
                <i className="ri-eye-line mr-2"></i>
                View Records
              </Button>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-6 text-center flex flex-col items-center">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-purple-100 text-purple-600 mb-4">
                <i className="ri-stethoscope-line text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Doctor Review</h3>
              <p className="mt-2 text-sm text-gray-600">Review prescriptions and generate recommendations</p>
              <Button 
                className="mt-5 bg-purple-600 hover:bg-purple-700"
                onClick={() => setLocation('/patients')}
              >
                <i className="ri-microscope-line mr-2"></i>
                Review Patients
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

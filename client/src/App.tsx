import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import { ProtectedRoute } from "./lib/protected-route";
import PatientForm from "@/pages/patient-form";
import PatientRecords from "@/pages/patient-records";
import PatientDetails from "@/pages/patient-details";
import DoctorReview from "@/pages/doctor-review";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/patient/new" component={PatientForm} />
      <ProtectedRoute path="/patient/edit/:id" component={PatientForm} />
      <ProtectedRoute path="/patients" component={PatientRecords} />
      <ProtectedRoute path="/patient/:id" component={PatientDetails} />
      <ProtectedRoute path="/doctor/review/:id" component={DoctorReview} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const { user, loginMutation } = useAuth();
  const { toast } = useToast();
  const [loginData, setLoginData] = useState({ username: "", password: "" });

  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }
    
    loginMutation.mutate(loginData);
  };

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-100 to-blue-50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
              <i className="ri-eye-line text-3xl text-primary-600"></i>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-800">OptiPrescribe</h2>
            <p className="mt-2 text-sm text-gray-600">Professional vision prescription management</p>
          </div>
          
          <div className="mt-6">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <Label htmlFor="username">Username</Label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ri-user-line text-gray-400"></i>
                  </div>
                  <Input 
                    id="username" 
                    type="text" 
                    placeholder="Enter your username" 
                    className="pl-10" 
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ri-lock-line text-gray-400"></i>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Enter your password" 
                    className="pl-10" 
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center">
                    <i className="ri-loader-4-line animate-spin mr-2"></i> Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
              
              <div className="text-center text-sm mt-4 text-gray-600">
                <p>Default credentials: admin / admin</p>
                <p className="mt-1">Contact administrator for access</p>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

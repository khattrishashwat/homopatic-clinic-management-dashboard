import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { LogIn, Eye, EyeOff, Shield } from "lucide-react";
import { authApi } from "@/services/adminApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: () => authApi.login(email, password),
    onSuccess: ({ token, user }) => {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      toast.success("Login successful");
      navigate({ to: "/" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#004732] via-[#006b4d] to-[#004732] px-4">
      <Card className="w-full max-w-md overflow-hidden border-0 bg-white shadow-2xl">
        {/* Decorative gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#004732] via-[#008060] to-[#004732]" />
        
        <CardHeader className="space-y-4 text-center">
          {/* Logo Section */}
          <div className="flex justify-center">
            <div className="rounded-full bg-gradient-to-br from-[#004732] to-[#008060] p-4 shadow-lg">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <div>
            <CardTitle className="text-3xl font-bold text-[#004732]">
              Welcome Back
            </CardTitle>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your admin account
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              loginMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="border-gray-300 focus:border-[#004732] focus:ring-[#004732]"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="border-gray-300 focus:border-[#004732] focus:ring-[#004732] pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#004732] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <Button
              className="w-full bg-[#004732] hover:bg-[#006b4d] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              type="submit"
              disabled={loginMutation.isPending}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          
          {/* Additional decorative elements */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Secure admin access only
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
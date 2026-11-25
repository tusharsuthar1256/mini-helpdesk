import { useNavigate } from "react-router-dom";
import { RiCustomerService2Fill } from "@remixicon/react";
import { AuthCard } from "@/components/application/auth/auth-card";
import { toast } from "@/components/base/toast/toast";
import { useAuth } from "@/context/AuthContext";
import { getError } from "@/api/api";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (data: any) => {
    try {
      await login(data.get("email"), data.get("password"));
      toast.success("Login successful");
      navigate("/");
    } catch (error) {
      toast.error(getError(error));
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background-full p-4">
      <AuthCard
        mode="signin"
        providers={[]}
        showSigninExtras={false}
        centered
        logo={<RiCustomerService2Fill className="size-10 text-accent-500" />}
        title="Welcome to Helpdesk"
        description="Sign in to raise and track your support tickets."
        switchHref="/register"
        onSubmit={handleLogin}
        className="w-full max-w-md"
      />
    </main>
  );
};

export default LoginPage;

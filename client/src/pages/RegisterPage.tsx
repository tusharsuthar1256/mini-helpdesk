import { useNavigate } from "react-router-dom";
import { RiCustomerService2Fill } from "@remixicon/react";
import { AuthCard } from "@/components/application/auth/auth-card";
import { toast } from "@/components/base/toast/toast";
import { useAuth } from "@/context/AuthContext";
import { getError } from "@/api/api";

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (data: any) => {
    if (data.get("password") !== data.get("confirmPassword")) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await register(data.get("name"), data.get("email"), data.get("password"));
      toast.success("Account created");
      navigate("/");
    } catch (error) {
      toast.error(getError(error));
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background-full p-4">
      <AuthCard
        mode="signup"
        providers={[]}
        confirmPassword
        centered
        logo={<RiCustomerService2Fill className="size-10 text-accent-500" />}
        title="Create your helpdesk account"
        description="Raise support tickets and track them until they are resolved."
        switchHref="/login"
        onSubmit={handleRegister}
        footnote="Passwords need 8+ characters with a letter and a number."
        className="w-full max-w-md"
      />
    </main>
  );
};

export default RegisterPage;

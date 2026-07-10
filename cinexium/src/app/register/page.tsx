import { RegisterForm } from '@/components/auth/RegisterForm';
import { AuthBackground } from '@/components/auth/AuthBackground';

export default function RegisterPage() {
  return (
    <main className="min-h-screen relative flex items-center justify-center p-4">
      <AuthBackground />
      <RegisterForm />
    </main>
  );
}

import { RegisterForm } from '@/components/auth/RegisterForm';
import { AuthBackground } from '@/components/auth/AuthBackground';

export default function RegisterPage() {
  return (
    <main className="h-[100dvh] overflow-hidden md:min-h-screen md:overflow-auto relative flex items-center justify-center p-4">
      <AuthBackground />
      <RegisterForm />
    </main>
  );
}

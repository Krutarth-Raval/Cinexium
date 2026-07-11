import { LoginForm } from '@/components/auth/LoginForm';
import { AuthBackground } from '@/components/auth/AuthBackground';

export default function LoginPage() {
  return (
    <main className="h-[100dvh] overflow-hidden md:min-h-screen md:overflow-auto relative flex items-center justify-center p-4">
      <AuthBackground />
      <LoginForm />
    </main>
  );
}

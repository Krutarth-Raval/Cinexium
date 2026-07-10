import { LoginForm } from '@/components/auth/LoginForm';
import { AuthBackground } from '@/components/auth/AuthBackground';

export default function LoginPage() {
  return (
    <main className="min-h-screen relative flex items-center justify-center p-4">
      <AuthBackground />
      <LoginForm />
    </main>
  );
}

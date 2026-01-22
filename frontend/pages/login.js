/**
 * Login Page
 * User authentication page
 */

import { useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/card';
import { LayoutDashboard } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-auto flex items-center justify-center">
              <img src="/logo_intersnack.png" alt="Intersnack" className="h-full w-auto object-contain" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-primary">Intersnack Forecast</h1>
          <p className="text-center text-muted-foreground">
            Sign in to access the forecasting platform
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Company Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@intersnack.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <strong>Demo accounts:</strong>
              <ul className="mt-2 space-y-1">
                <li>• admin@intersnack.com (Admin)</li>
                <li>• user@intersnack.com (User)</li>
                <li>• forecast.analyst@intersnack.com (Analyst)</li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.href = '/api/v1/auth/azure/login'}
              className="w-full gap-2 border-input hover:bg-accent"
            >
              <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0H10.875V10.875H0V0Z" fill="#F25022" />
                <path d="M12.125 0H23V10.875H12.125V0Z" fill="#7FBA00" />
                <path d="M0 12.125H10.875V23H0V12.125Z" fill="#00A4EF" />
                <path d="M12.125 12.125H23V23H12.125V12.125Z" fill="#FFB900" />
              </svg>
              Sign in with Microsoft
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

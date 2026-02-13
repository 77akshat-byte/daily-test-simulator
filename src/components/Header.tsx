import { useAuth } from './AuthProvider';
import { Button } from './ui/button';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Daily Test Simulator</h1>
          {user && (
            <p className="text-sm text-muted-foreground">
              Welcome, {user.email}
            </p>
          )}
        </div>
        {user && (
          <Button variant="outline" onClick={() => signOut()}>
            Sign Out
          </Button>
        )}
      </div>
    </header>
  );
}

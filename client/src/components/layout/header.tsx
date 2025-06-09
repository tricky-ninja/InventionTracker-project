import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import { Lightbulb, Search, Plus, Settings, LogOut, Shield } from "lucide-react";

export default function Header() {
  const { user } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return '👑';
      case 'faculty':
        return '👨‍🎓';
      default:
        return '👤';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'faculty':
        return 'Faculty';
      default:
        return 'Student Researcher';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Lightbulb className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-heading font-bold text-neutral-800">InnovateHub</h1>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/" 
                className={`pb-4 ${isActive('/') ? 'text-primary font-medium border-b-2 border-primary' : 'text-neutral-600 hover:text-primary'}`}
              >
                Dashboard
              </Link>
              <Link 
                href="/create" 
                className={`pb-4 ${isActive('/create') ? 'text-primary font-medium border-b-2 border-primary' : 'text-neutral-600 hover:text-primary'}`}
              >
                My Inventions
              </Link>
              {user?.role === 'admin' && (
                <Link 
                  href="/admin" 
                  className={`pb-4 ${isActive('/admin') ? 'text-primary font-medium border-b-2 border-primary' : 'text-neutral-600 hover:text-primary'}`}
                >
                  Admin Panel
                </Link>
              )}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden sm:block">
              <Input
                type="text"
                placeholder="Search inventions..."
                className="w-64 pl-10 pr-4"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
            </div>
            
            <Link href="/create">
              <Button className="bg-primary hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Invention
              </Button>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-3 cursor-pointer">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-neutral-800">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-neutral-600 flex items-center justify-end">
                      {getRoleIcon(user?.role || 'user')} {getRoleLabel(user?.role || 'user')}
                    </p>
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.profileImageUrl || undefined} />
                    <AvatarFallback>
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-neutral-500">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                {user?.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = '/api/logout'}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

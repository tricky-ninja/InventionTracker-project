import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import InventionCard from "@/components/invention-card";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

const availableTags = [
  { id: "ai-ml", label: "AI/ML", color: "bg-blue-100 text-blue-800" },
  { id: "biotech", label: "Biotech", color: "bg-green-100 text-green-800" },
  { id: "robotics", label: "Robotics", color: "bg-purple-100 text-purple-800" },
  { id: "iot", label: "IoT", color: "bg-orange-100 text-orange-800" },
  { id: "energy", label: "Energy", color: "bg-red-100 text-red-800" },
  { id: "materials", label: "Materials", color: "bg-teal-100 text-teal-800" },
  { id: "sustainability", label: "Sustainability", color: "bg-green-100 text-green-800" },
  { id: "wearables", label: "Wearables", color: "bg-purple-100 text-purple-800" },
  { id: "healthcare", label: "Healthcare", color: "bg-pink-100 text-pink-800" },
];

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>(["pending"]);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("recent");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: inventions, isLoading, error } = useQuery({
    queryKey: ["/api/inventions", { status: statusFilters.join(","), tags: tagFilters.join(",") }],
    enabled: isAuthenticated,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return <div className="min-h-screen bg-neutral-50 flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleStatusFilterChange = (status: string, checked: boolean) => {
    if (checked) {
      setStatusFilters([...statusFilters, status]);
    } else {
      setStatusFilters(statusFilters.filter(s => s !== status));
    }
  };

  const handleTagClick = (tagId: string) => {
    if (tagFilters.includes(tagId)) {
      setTagFilters(tagFilters.filter(t => t !== tagId));
    } else {
      setTagFilters([...tagFilters, tagId]);
    }
  };

  const filteredInventions = inventions?.filter(invention =>
    invention.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invention.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Filter Panel */}
            <Card className="border border-neutral-200">
              <CardContent className="p-6">
                <h3 className="font-heading font-semibold text-neutral-800 mb-4">Filters</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Status</label>
                    <div className="space-y-2">
                      {[
                        { value: "pending", label: "Pending Review" },
                        { value: "under_review", label: "Under Review" },
                        { value: "approved", label: "Approved" },
                        { value: "rejected", label: "Rejected" },
                      ].map(status => (
                        <label key={status.value} className="flex items-center">
                          <Checkbox
                            checked={statusFilters.includes(status.value)}
                            onCheckedChange={(checked) => handleStatusFilterChange(status.value, checked as boolean)}
                          />
                          <span className="ml-2 text-sm">{status.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Category Tags</label>
                    <div className="flex flex-wrap gap-1">
                      {availableTags.map(tag => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className={`cursor-pointer hover:opacity-80 ${
                            tagFilters.includes(tag.id) ? 'ring-2 ring-primary' : ''
                          } ${tag.color}`}
                          onClick={() => handleTagClick(tag.id)}
                        >
                          {tag.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {stats && (
              <Card className="border border-neutral-200">
                <CardContent className="p-6">
                  <h3 className="font-heading font-semibold text-neutral-800 mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Total Inventions</span>
                      <span className="font-semibold text-neutral-800">{stats.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Pending Review</span>
                      <span className="font-semibold text-accent">{stats.pending}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Approved</span>
                      <span className="font-semibold text-secondary">{stats.approved}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Rejected</span>
                      <span className="font-semibold text-red-600">{stats.rejected}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-heading font-bold text-neutral-800">Recent Inventions</h2>
                <p className="text-neutral-600 mt-1">
                  {user?.role === 'faculty' 
                    ? 'Review and evaluate new innovation submissions'
                    : 'Discover innovative research and ideas'
                  }
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Sort by Recent</SelectItem>
                    <SelectItem value="popular">Sort by Popular</SelectItem>
                    <SelectItem value="category">Sort by Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search inventions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Invention Cards */}
            <div className="space-y-6">
              {isLoading ? (
                <div className="text-center py-8">Loading inventions...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  Error loading inventions. Please try again.
                </div>
              ) : filteredInventions.length === 0 ? (
                <div className="text-center py-8 text-neutral-600">
                  No inventions found matching your criteria.
                </div>
              ) : (
                filteredInventions.map((invention) => (
                  <InventionCard
                    key={invention.id}
                    invention={invention}
                    currentUser={user}
                  />
                ))
              )}
            </div>

            {/* Load More */}
            {filteredInventions.length > 0 && (
              <div className="text-center mt-8">
                <Button variant="outline" size="lg">
                  Load More Inventions
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

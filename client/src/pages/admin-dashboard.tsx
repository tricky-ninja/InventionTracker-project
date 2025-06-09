import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Users, 
  FileText,
  Shield
} from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedInvention, setSelectedInvention] = useState<any>(null);
  const [fundingAmount, setFundingAmount] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Access Denied",
        description: "Admin access required.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }
  }, [user, isAuthenticated, authLoading, toast]);

  const { data: inventions, isLoading } = useQuery({
    queryKey: ["/api/inventions"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, fundingAmount }: { id: number; status: string; fundingAmount?: number }) => {
      return apiRequest("PATCH", `/api/inventions/${id}/status`, { status, fundingAmount });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invention status updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setSelectedInvention(null);
      setFundingAmount("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return <div className="min-h-screen bg-neutral-50 flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  const handleApprove = () => {
    if (!selectedInvention) return;
    
    const amount = fundingAmount ? parseInt(fundingAmount) : undefined;
    updateStatusMutation.mutate({
      id: selectedInvention.id,
      status: "approved",
      fundingAmount: amount,
    });
  };

  const handleReject = () => {
    if (!selectedInvention) return;
    
    updateStatusMutation.mutate({
      id: selectedInvention.id,
      status: "rejected",
    });
  };

  const pendingInventions = inventions?.filter(inv => inv.status === "pending" || inv.status === "under_review") || [];
  const approvedInventions = inventions?.filter(inv => inv.status === "approved") || [];
  const rejectedInventions = inventions?.filter(inv => inv.status === "rejected") || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "under_review":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "under_review":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-orange-100 text-orange-800";
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-neutral-800 flex items-center gap-2">
              <Shield className="h-8 w-8 text-admin" />
              Admin Dashboard
            </h1>
            <p className="text-neutral-600 mt-1">Manage invention submissions and funding decisions</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-neutral-600">Total Inventions</p>
                    <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-neutral-600">Pending Review</p>
                    <p className="text-2xl font-bold text-neutral-900">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-neutral-600">Approved</p>
                    <p className="text-2xl font-bold text-neutral-900">{stats.approved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-neutral-600">Rejected</p>
                    <p className="text-2xl font-bold text-neutral-900">{stats.rejected}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pending Approvals */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-heading font-bold text-neutral-800">
              Pending Approvals ({pendingInventions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingInventions.length === 0 ? (
              <p className="text-neutral-600 text-center py-8">No inventions pending approval</p>
            ) : (
              <div className="space-y-4">
                {pendingInventions.map((invention) => (
                  <div key={invention.id} className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={invention.author.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {invention.author.firstName?.[0]}{invention.author.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium text-neutral-800">{invention.title}</h4>
                          <p className="text-sm text-neutral-600">
                            by {invention.author.firstName} {invention.author.lastName}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {format(new Date(invention.createdAt), 'MMM d, yyyy')}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {invention.tags.slice(0, 3).map((tag: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {invention.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{invention.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`flex items-center gap-1 ${getStatusColor(invention.status)}`}>
                          {getStatusIcon(invention.status)}
                          {invention.status === "under_review" ? "Under Review" : "Pending"}
                        </Badge>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => setSelectedInvention(invention)}
                              className="bg-admin hover:bg-pink-600"
                            >
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Review Invention</DialogTitle>
                            </DialogHeader>
                            {selectedInvention && (
                              <div className="space-y-4">
                                <div>
                                  <h3 className="font-semibold text-lg">{selectedInvention.title}</h3>
                                  <p className="text-sm text-neutral-600 mt-1">
                                    by {selectedInvention.author.firstName} {selectedInvention.author.lastName}
                                  </p>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium">Description</Label>
                                  <p className="text-sm text-neutral-700 mt-1 bg-neutral-50 p-3 rounded">
                                    {selectedInvention.description}
                                  </p>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium">Tags</Label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedInvention.tags.map((tag: string, index: number) => (
                                      <Badge key={index} variant="secondary">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Engagement</Label>
                                  <div className="text-sm text-neutral-600 mt-1">
                                    <p>{selectedInvention._count.likes} likes • {selectedInvention._count.dislikes} dislikes</p>
                                    <p>{selectedInvention._count.comments} comments</p>
                                  </div>
                                </div>
                                
                                <div className="border-t pt-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="fundingAmount" className="text-sm font-medium">
                                        Funding Amount (USD)
                                      </Label>
                                      <Input
                                        id="fundingAmount"
                                        type="number"
                                        placeholder="Enter funding amount"
                                        value={fundingAmount}
                                        onChange={(e) => setFundingAmount(e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-end space-x-2 mt-4">
                                    <Button
                                      variant="outline"
                                      onClick={handleReject}
                                      disabled={updateStatusMutation.isPending}
                                      className="text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                      Reject
                                    </Button>
                                    <Button
                                      onClick={handleApprove}
                                      disabled={updateStatusMutation.isPending || !fundingAmount}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      {updateStatusMutation.isPending ? "Processing..." : "Approve & Fund"}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Decisions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Approved */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading font-semibold text-green-700">
                Recently Approved ({approvedInventions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvedInventions.slice(0, 5).map((invention) => (
                <div key={invention.id} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{invention.title}</p>
                    <p className="text-xs text-neutral-600">
                      {invention.author.firstName} {invention.author.lastName}
                    </p>
                    {invention.fundingAmount && (
                      <p className="text-xs text-green-600 font-medium">
                        ${invention.fundingAmount.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Rejected */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading font-semibold text-red-700">
                Recently Rejected ({rejectedInventions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rejectedInventions.slice(0, 5).map((invention) => (
                <div key={invention.id} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{invention.title}</p>
                    <p className="text-xs text-neutral-600">
                      {invention.author.firstName} {invention.author.lastName}
                    </p>
                  </div>
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

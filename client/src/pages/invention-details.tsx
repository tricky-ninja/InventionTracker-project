import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import CommentSection from "@/components/comment-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  ThumbsUp, 
  ThumbsDown, 
  FileText, 
  Download, 
  Clock, 
  CheckCircle, 
  XCircle,
  DollarSign,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

export default function InventionDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inventions, isLoading } = useQuery({
    queryKey: ["/api/inventions", id],
    enabled: !!id,
  });

  const invention = inventions?.[inventions?.length - id]

  const { data: userLike } = useQuery({
    queryKey: ["/api/inventions", id, "user-like"],
    enabled: !!id && !!user,
  });

  const likeMutation = useMutation({
    mutationFn: async ({ isLike }: { isLike: boolean }) => {
      return apiRequest("POST", `/api/inventions/${id}/like`, { isLike });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventions", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventions", id, "user-like"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading invention details...</div>
        </div>
      </div>
    );
  }

  if (!invention) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Invention not found</div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "under_review":
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-orange-600" />;
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "under_review":
        return "Under Review";
      default:
        return "Pending Review";
    }
  };

  const handleLike = (isLike: boolean) => {
    likeMutation.mutate({ isLike });
  };

  const likesCount = invention.likes?.filter(like => like.isLike).length || 0;
  const dislikesCount = invention.likes?.filter(like => !like.isLike).length || 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={invention.author.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {invention.author.firstName?.[0]}{invention.author.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-neutral-800">
                        {invention.author.firstName} {invention.author.lastName}
                      </h4>
                      <p className="text-sm text-neutral-600 flex items-center">
                        {invention.author.role === 'faculty' ? (
                          <>👨‍🎓 Faculty Member</>
                        ) : invention.author.role === 'admin' ? (
                          <>👑 Administrator</>
                        ) : (
                          <>👤 Student Researcher</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`flex items-center gap-1 ${getStatusColor(invention.status)}`}>
                      {getStatusIcon(invention.status)}
                      {getStatusLabel(invention.status)}
                    </Badge>
                    <div className="text-right text-sm text-neutral-500">
                      <p>{format(new Date(invention.createdAt!), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                </div>
                
                <CardTitle className="text-2xl font-heading font-bold text-neutral-800 mt-4">
                  {invention.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <p className="text-neutral-600 leading-relaxed mb-6">
                  {invention.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {invention.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Funding Status */}
                {invention.status === "approved" && invention.fundingAmount && (
                  <Card className="bg-green-50 border-green-200 mb-6">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">
                          Funding Approved: ${invention.fundingAmount.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Approved by Admin Review Board
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                  <div className="flex items-center space-x-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(true)}
                      disabled={likeMutation.isPending}
                      className={`flex items-center space-x-2 ${
                        userLike?.isLike === true ? 'text-green-600' : 'text-neutral-500'
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>{likesCount}</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(false)}
                      disabled={likeMutation.isPending}
                      className={`flex items-center space-x-2 ${
                        userLike?.isLike === false ? 'text-red-600' : 'text-neutral-500'
                      }`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      <span>{dislikesCount}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <CommentSection inventionId={invention.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Files */}
            {invention.files && invention.files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-heading font-semibold">
                    Supporting Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {invention.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-red-500" />
                          <div>
                            <p className="text-sm font-medium text-neutral-800 truncate max-w-32">
                              {file.originalName}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {(file.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`/api/files/${file.filename}`, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading font-semibold">
                  Project Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-neutral-500" />
                  <span className="text-neutral-600">
                    Submitted {format(new Date(invention.createdAt!), 'MMMM d, yyyy')}
                  </span>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm font-medium text-neutral-700 mb-1">Category Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {invention.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm font-medium text-neutral-700 mb-1">Engagement</p>
                  <div className="text-sm text-neutral-600 space-y-1">
                    <p>{invention.comments?.length || 0} comments</p>
                    <p>{likesCount} likes • {dislikesCount} dislikes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

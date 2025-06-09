import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  FileText, 
  Image, 
  Clock, 
  CheckCircle, 
  XCircle,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";

interface InventionCardProps {
  invention: any;
  currentUser: any;
}

export default function InventionCard({ invention, currentUser }: InventionCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "under_review":
        return "Under Admin Review";
      default:
        return "Pending Review";
    }
  };

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
        return 'Faculty Member';
      default:
        return 'Student Researcher';
    }
  };

  return (
    <Card className="border border-neutral-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
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
                {getRoleIcon(invention.author.role)} {getRoleLabel(invention.author.role)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`flex items-center gap-1 ${getStatusColor(invention.status)}`}>
              {getStatusIcon(invention.status)}
              {getStatusLabel(invention.status)}
            </Badge>
            <div className="text-right text-sm text-neutral-500">
              <p>{format(new Date(invention.createdAt), 'h:mm a')}</p>
              <p>{format(new Date(invention.createdAt), 'MMM d')}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <Link href={`/invention/${invention.id}`}>
            <h3 className="text-xl font-heading font-semibold text-neutral-800 mb-2 hover:text-primary cursor-pointer">
              {invention.title}
            </h3>
          </Link>
          <p className="text-neutral-600 text-sm leading-relaxed line-clamp-3">
            {invention.description}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {invention.tags.slice(0, 4).map((tag: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {invention.tags.length > 4 && (
            <Badge variant="secondary" className="text-xs">
              +{invention.tags.length - 4} more
            </Badge>
          )}
        </div>

        {/* Files */}
        {invention._count.files > 0 && (
          <div className="flex items-center space-x-4 mb-4 text-sm text-neutral-600">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-red-500" />
              <span>{invention._count.files} files</span>
            </div>
          </div>
        )}

        {/* Funding Info */}
        {invention.status === "approved" && invention.fundingAmount && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Funding Approved: ${invention.fundingAmount.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              Approved by Admin Review Board
            </p>
          </div>
        )}

        {/* Faculty Review Complete */}
        {invention.status === "under_review" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Faculty Review Complete</p>
                <p className="text-xs text-blue-600">Recommended for funding by faculty members</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-neutral-500">
              <ThumbsUp className="h-4 w-4" />
              <span className="text-sm font-medium">{invention._count.likes}</span>
            </div>
            <div className="flex items-center space-x-2 text-neutral-500">
              <ThumbsDown className="h-4 w-4" />
              <span className="text-sm font-medium">{invention._count.dislikes}</span>
            </div>
            <div className="flex items-center space-x-2 text-neutral-500">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{invention._count.comments} comments</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href={`/invention/${invention.id}`}>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </Link>
            {currentUser?.role === 'faculty' && invention.status === 'pending' && (
              <Link href={`/invention/${invention.id}`}>
                <Button size="sm" className="bg-faculty hover:bg-purple-700 text-white">
                  Add Review
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

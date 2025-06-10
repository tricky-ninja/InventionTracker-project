import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send } from "lucide-react";
import { format } from "date-fns";

interface CommentSectionProps {
  inventionId: number;
}

export default function CommentSection({ inventionId }: CommentSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: inventions } = useQuery({
    queryKey: ["/api/inventions", inventionId.toString()],
  });

  const invention = inventions?.[inventions?.length - inventionId]

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/inventions/${inventionId}/comments`, { content });
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/inventions", inventionId.toString()] });
      toast({
        title: "Success",
        description: "Your comment has been added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      createCommentMutation.mutate(newComment.trim());
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

  const comments = invention?.comments || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-heading font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Add Comment Form */}
        {user && (
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <div className="flex items-start space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback>
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-end mt-2">
                  <Button 
                    type="submit" 
                    disabled={!newComment.trim() || createCommentMutation.isPending}
                    size="sm"
                    className="bg-primary hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map((comment: any) => (
              <div key={comment.id} className="flex items-start space-x-3 p-4 bg-neutral-50 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.author.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {comment.author.firstName?.[0]}{comment.author.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-sm text-neutral-800">
                      {comment.author.firstName} {comment.author.lastName}
                    </h4>
                    <span className="text-xs text-neutral-600">
                      {getRoleIcon(comment.author.role)} {getRoleLabel(comment.author.role)}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {format(new Date(comment.createdAt), 'MMM d, yyyy • h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

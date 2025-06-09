import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Users, Award, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-8">
              <Lightbulb className="h-12 w-12 text-primary" />
              <h1 className="text-4xl font-heading font-bold text-neutral-800">InnovateHub</h1>
            </div>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-neutral-800 mb-6">
              Transform Ideas into Innovation
            </h2>
            <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
              A comprehensive platform for managing invention submissions, faculty reviews, and funding approvals. 
              Connect researchers, streamline the review process, and accelerate innovation.
            </p>
            <Button 
              size="lg" 
              className="bg-primary hover:bg-blue-700 text-white px-8 py-3 text-lg"
              onClick={() => window.location.href = '/api/login'}
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-heading font-bold text-neutral-800 mb-4">
              Streamline Your Innovation Process
            </h3>
            <p className="text-xl text-neutral-600">
              Everything you need to manage inventions from submission to funding approval
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border border-neutral-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Lightbulb className="h-12 w-12 text-primary mx-auto mb-4" />
                <h4 className="text-xl font-heading font-semibold text-neutral-800 mb-2">
                  Submit Inventions
                </h4>
                <p className="text-neutral-600">
                  Easy-to-use forms for submitting invention ideas with file uploads and tagging
                </p>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-faculty mx-auto mb-4" />
                <h4 className="text-xl font-heading font-semibold text-neutral-800 mb-2">
                  Faculty Review
                </h4>
                <p className="text-neutral-600">
                  Tag-based matching system connects faculty experts with relevant inventions
                </p>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Award className="h-12 w-12 text-admin mx-auto mb-4" />
                <h4 className="text-xl font-heading font-semibold text-neutral-800 mb-2">
                  Admin Approval
                </h4>
                <p className="text-neutral-600">
                  Comprehensive dashboard for administrators to manage funding decisions
                </p>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 text-secondary mx-auto mb-4" />
                <h4 className="text-xl font-heading font-semibold text-neutral-800 mb-2">
                  Track Progress
                </h4>
                <p className="text-neutral-600">
                  Real-time status updates and analytics for all innovation projects
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-heading font-bold text-white mb-6">
            Ready to Start Innovating?
          </h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join our community of researchers, faculty, and administrators working together 
            to bring groundbreaking ideas to life.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="bg-white text-primary hover:bg-neutral-100 px-8 py-3 text-lg"
            onClick={() => window.location.href = '/api/login'}
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

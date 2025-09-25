
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, FileText, MessageCircle, ExternalLink } from 'lucide-react';

const ProviderSupport = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Terms & Support</h1>

      {/* Quick Help */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Terms of Use</h3>
            <p className="text-sm text-gray-600 mb-4">
              Read our partner terms and conditions
            </p>
            <Button variant="outline" size="sm">
              View Terms
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <HelpCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Safety Guidelines</h3>
            <p className="text-sm text-gray-600 mb-4">
              Learn about safety and responsibility guidelines
            </p>
            <Button variant="outline" size="sm">
              View Guidelines
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <MessageCircle className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Contact Support</h3>
            <p className="text-sm text-gray-600 mb-4">
              Get help from our support team
            </p>
            <Button variant="outline" size="sm">
              Start Chat
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">How do I get my room verified?</h4>
              <p className="text-sm text-gray-600">
                Upload 2 camera angle photos showing clear views of the interview area. Our team will review and approve within 24-48 hours.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">When do I receive payouts?</h4>
              <p className="text-sm text-gray-600">
                Payouts are processed on the 15th of each month for the previous month's earnings via your connected Stripe account.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">What if a candidate doesn't show up?</h4>
              <p className="text-sm text-gray-600">
                You'll still receive full payment for no-shows. Mark the booking as "No-Show" in your dashboard for our records.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Can I cancel a confirmed booking?</h4>
              <p className="text-sm text-gray-600">
                Cancellations should be avoided but contact our support team immediately if there's an emergency. Frequent cancellations may affect your listing.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">How do I update my bank details?</h4>
              <p className="text-sm text-gray-600">
                Go to Earnings & Payouts section and click "Update Bank Details" to modify your Stripe Express account information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle>Need More Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-2">Can't find what you're looking for?</p>
              <p className="text-sm text-gray-600">
                Our support team is available 24/7 to help with any questions or issues.
              </p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderSupport;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Upload, Camera, AlertCircle, HelpCircle } from 'lucide-react';

const ProviderVerification = () => {
  const rooms = [
    {
      id: 1,
      name: 'Conference Room A',
      status: 'verified',
      angle1: true,
      angle2: true,
      lighting: true
    },
    {
      id: 2,
      name: 'Private Office B',
      status: 'pending',
      angle1: true,
      angle2: false,
      lighting: true
    },
    {
      id: 3,
      name: 'Meeting Room C',
      status: 'rejected',
      angle1: false,
      angle2: false,
      lighting: false
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Verification Center</h1>
        <Button variant="outline">
          <HelpCircle className="w-4 h-4 mr-2" />
          Help & Guidelines
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Camera className="w-8 h-8 text-blue-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Get FaceDesk Verified</h3>
              <p className="text-blue-700 mb-4">
                Upload 2 camera angle photos for each room to become FaceDesk Verified. Verified rooms get 40% more bookings and higher visibility.
              </p>
              <div className="space-y-2 text-sm text-blue-700">
                <p>• <strong>Angle 1:</strong> Wide view showing the entire interview area</p>
                <p>• <strong>Angle 2:</strong> Close-up view of the candidate seating area</p>
                <p>• <strong>Lighting:</strong> Ensure good lighting without glare or shadows</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Verification Status */}
      <div className="space-y-4">
        {rooms.map((room) => (
          <Card key={room.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{room.name}</CardTitle>
                <Badge className={getStatusColor(room.status)}>
                  {room.status === 'verified' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {room.status === 'rejected' && <AlertCircle className="w-3 h-3 mr-1" />}
                  {room.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Checklist */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${
                    room.angle1 ? 'bg-green-50' : 'bg-gray-50'
                  }`}>
                    {room.angle1 ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                    )}
                    <span className={room.angle1 ? 'text-green-700' : 'text-gray-600'}>
                      Camera Angle 1
                    </span>
                  </div>
                  
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${
                    room.angle2 ? 'bg-green-50' : 'bg-gray-50'
                  }`}>
                    {room.angle2 ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                    )}
                    <span className={room.angle2 ? 'text-green-700' : 'text-gray-600'}>
                      Camera Angle 2
                    </span>
                  </div>
                  
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${
                    room.lighting ? 'bg-green-50' : 'bg-gray-50'
                  }`}>
                    {room.lighting ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                    )}
                    <span className={room.lighting ? 'text-green-700' : 'text-gray-600'}>
                      Good Lighting
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {room.status !== 'verified' && (
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photos
                    </Button>
                  )}
                  {room.status === 'rejected' && (
                    <Button variant="outline">
                      View Feedback
                    </Button>
                  )}
                  {room.status === 'verified' && (
                    <Button variant="outline">
                      View Verified Photos
                    </Button>
                  )}
                </div>

                {room.status === 'rejected' && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-red-700 text-sm">
                      <strong>Rejection Reason:</strong> Poor lighting in angle 2. Please retake the photo with better lighting and resubmit.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tips for Passing Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p>• <strong>Camera Quality:</strong> Use a high-resolution camera (minimum 1080p)</p>
            <p>• <strong>Positioning:</strong> Mount cameras at eye level for the best view</p>
            <p>• <strong>Lighting:</strong> Natural lighting works best. Avoid backlighting</p>
            <p>• <strong>Coverage:</strong> Ensure the entire interview area is visible</p>
            <p>• <strong>Privacy:</strong> Make sure no sensitive information is visible in the frame</p>
          </div>
          <div className="mt-4">
            <Button variant="outline">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderVerification;

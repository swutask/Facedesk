
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, User, Building } from "lucide-react";

const ForWhom = () => {
  return (
    <section id="for-whom" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold text-gray-900">Built for Everyone</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            FaceDesk serves the entire hiring ecosystem with tailored solutions.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="recruiters" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-100 p-1 rounded-xl">
              <TabsTrigger value="recruiters" className="flex items-center gap-2 rounded-lg">
                <Users className="w-4 h-4" />
                Recruiters
              </TabsTrigger>
              <TabsTrigger value="candidates" className="flex items-center gap-2 rounded-lg">
                <User className="w-4 h-4" />
                Candidates
              </TabsTrigger>
              <TabsTrigger value="spaces" className="flex items-center gap-2 rounded-lg">
                <Building className="w-4 h-4" />
                Co-working Spaces
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recruiters" className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">For Recruiters</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Key Features</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Easy booking system</li>
                      <li>• Real-time monitoring</li>
                      <li>• Interview recordings</li>
                      <li>• Candidate management</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Benefits</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Ensure interview integrity</li>
                      <li>• Reduce hiring risks</li>
                      <li>• Save time and resources</li>
                      <li>• Maintain compliance</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="candidates" className="space-y-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">For Candidates</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Experience</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Professional environment</li>
                      <li>• Convenient locations</li>
                      <li>• Technical support</li>
                      <li>• Stress-free setup</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Advantages</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Level playing field</li>
                      <li>• No technical issues</li>
                      <li>• Professional atmosphere</li>
                      <li>• Fair assessment</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="spaces" className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-8 rounded-2xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">For Co-working Spaces</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Partnership</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Additional revenue stream</li>
                      <li>• Premium room utilization</li>
                      <li>• Professional certification</li>
                      <li>• Marketing support</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Requirements</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li>• High-speed internet</li>
                      <li>• Professional environment</li>
                      <li>• Camera-ready rooms</li>
                      <li>• Security protocols</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default ForWhom;

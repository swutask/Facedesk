
import { Shield, MapPin, Bot, Eye, Video } from "lucide-react";

const Benefits = () => {
  const benefits = [
    {
      icon: Shield,
      title: "Verified 2-Camera Setup",
      description: "Professional dual-camera monitoring ensures comprehensive coverage"
    },
    {
      icon: MapPin,
      title: "Nearby Co-working Rooms",
      description: "Convenient locations within reach of your candidates"
    },
    {
      icon: Bot,
      title: "No AI Cheating",
      description: "Prevent AI assistance and maintain interview integrity"
    },
    {
      icon: Eye,
      title: "Safe and Monitored",
      description: "Professional supervision and secure environment"
    },
    {
      icon: Video,
      title: "Works with Zoom/Meet",
      description: "Seamless integration with your existing video tools"
    }
  ];

  return (
    <section id="benefits" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold text-gray-900">Why FaceDesk Works</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Built for enterprise hiring teams who demand integrity and reliability.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;

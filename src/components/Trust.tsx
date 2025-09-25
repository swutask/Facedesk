
import { Shield, Lock, Eye, FileCheck } from "lucide-react";

const Trust = () => {
  const trustBadges = [
    {
      icon: Shield,
      title: "GDPR Compliant",
      description: "Full compliance with data protection regulations"
    },
    {
      icon: Lock,
      title: "Encrypted Storage",
      description: "End-to-end encryption for all video content"
    },
    {
      icon: Eye,
      title: "Verified CCTV",
      description: "Professional monitoring systems in all locations"
    },
    {
      icon: FileCheck,
      title: "Consent First",
      description: "Clear consent processes for all participants"
    }
  ];

  return (
    <section id="trust" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold text-gray-900">Trust & Compliance</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Enterprise-grade security and compliance built into every aspect of our platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
          {trustBadges.map((badge, index) => (
            <div key={index} className="bg-white p-6 rounded-xl text-center space-y-4 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <badge.icon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">{badge.title}</h3>
              <p className="text-sm text-gray-600">{badge.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-3xl mx-auto">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Security & Privacy</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div className="space-y-2">
              <p>• All recordings are encrypted and stored securely</p>
              <p>• Candidate consent is obtained before recording</p>
              <p>• Data retention policies comply with regulations</p>
            </div>
            <div className="space-y-2">
              <p>• Access controls limit viewing to authorized personnel</p>
              <p>• Regular security audits and compliance checks</p>
              <p>• Transparent privacy policies and terms of service</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Trust;

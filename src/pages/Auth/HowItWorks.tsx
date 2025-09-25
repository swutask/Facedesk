
import { Calendar, MapPin, Video } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: Calendar,
      title: "Recruiter Books Space",
      description: "Select from verified co-working spaces near your candidate's location"
    },
    {
      icon: MapPin,
      title: "Candidate Checks In",
      description: "Candidate arrives at the venue and attends the online interview from the monitored room"
    },
    {
      icon: Video,
      title: "Interview & Review",
      description: "Interviewer conducts the session via Zoom/Meet and can review the recording"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold text-gray-900">How It Works</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Simple, secure, and seamless. Get started in three easy steps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center space-y-6 p-6 rounded-2xl hover:bg-gray-50 transition-all duration-300">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-300 to-transparent"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

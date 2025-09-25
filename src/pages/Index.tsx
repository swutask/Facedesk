
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/pages/Auth/HowItWorks";
import Benefits from "@/components/Benefits";
import ForWhom from "@/components/ForWhom";
import Trust from "@/components/Trust";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { useUser, RedirectToSignIn } from "@clerk/clerk-react";


const Index = () => {

  const { isLoaded, isSignedIn } = useUser();
  console.log("isSignedInisSignedIn ",isSignedIn);
  

  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <HowItWorks />
      <Benefits />
      <ForWhom />
      <Trust />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;

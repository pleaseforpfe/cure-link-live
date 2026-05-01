import { Navbar } from "@/components/Navbar";
import { NewsTicker } from "@/components/NewsTicker";
import { Hero } from "@/components/Hero";
import { LiveAttendance } from "@/components/LiveAttendance";
import { LiveStream } from "@/components/LiveStream";
import { PreviousEvents } from "@/components/PreviousEvents";
import { ProgramCTA } from "@/components/ProgramCTA";
import { RegistrationCTA } from "@/components/RegistrationCTA";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <NewsTicker />
      <main>
        <Hero />
        <LiveAttendance />
        <LiveStream />
        <PreviousEvents />
        <ProgramCTA />
        <RegistrationCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { QRCodeGenerator } from "@/components/QRCode";
import { motion } from "framer-motion";

export default function QRCodePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-primary mb-4">4JMC QR Code</h1>
            <p className="text-lg text-muted-foreground">
              Share this QR code to promote the 4èmes Journées Médico-Chirurgicales d'Ouargla
            </p>
          </div>

          <div className="bg-card rounded-3xl border border-border p-8 shadow-card">
            <QRCodeGenerator
              url="https://4jmcdeouargla.vercel.app/"
              size={300}
              title="Scan to Join 4JMC"
            />
          </div>

          {/* Additional QR codes for different purposes */}
          <div className="mt-16 grid md:grid-cols-2 gap-8">
            <div className="bg-card rounded-3xl border border-border p-8 shadow-card">
              <h3 className="text-lg font-bold text-primary mb-4 text-center">Registration Form</h3>
              <QRCodeGenerator
                url="https://docs.google.com/forms/d/e/1FAIpQLSeVRQDEVvzojcHZKq3iJRSA9LWVuzjmleR26Vx916ysBEQ5dQ/viewform"
                size={200}
                title="Register Now"
              />
            </div>

            <div className="bg-card rounded-3xl border border-border p-8 shadow-card">
              <h3 className="text-lg font-bold text-primary mb-4 text-center">Social Links</h3>
              <QRCodeGenerator
                url="https://4journemdico-chirurgicale.taplink.site/"
                size={200}
                title="Follow Us"
              />
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}

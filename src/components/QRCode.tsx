import { QRCodeSVG } from "qrcode.react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

interface QRCodeGeneratorProps {
  url?: string;
  size?: number;
  title?: string;
}

export function QRCodeGenerator({
  url = "https://4jmcdeouargla.vercel.app/",
  size = 250,
  title = "Join the 4JMC",
}: QRCodeGeneratorProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQRCode = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "4JMC-QRCode.png";
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary mb-2">{title}</h2>
        <p className="text-muted-foreground">Scan to visit the event website</p>
      </div>

      {/* QR Code Container with Medical Theme Styling */}
      <div
        ref={qrRef}
        className="relative p-6 rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 shadow-elegant border-4 border-secondary"
        style={{
          background: "linear-gradient(135deg, #002366 0%, #003d99 50%, #004db3 100%)",
        }}
      >
        {/* Decorative medical icons */}
        <div className="absolute -top-3 -right-3 text-3xl opacity-20">⚕️</div>
        <div className="absolute -bottom-3 -left-3 text-3xl opacity-20">❤️</div>

        <div className="relative bg-white p-4 rounded-2xl">
          <QRCodeSVG
            value={url}
            size={size}
            level="H"
            includeMargin={true}
            fgColor="#002366"
            bgColor="#ffffff"
          />
        </div>
      </div>

      {/* Download Button */}
      <Button
        onClick={downloadQRCode}
        className="gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
      >
        <Download className="h-4 w-4" />
        Download QR Code
      </Button>

      {/* URL Display */}
      <div className="text-xs text-muted-foreground text-center max-w-sm break-all">
        {url}
      </div>
    </div>
  );
}

export default QRCodeGenerator;

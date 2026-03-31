import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, RefreshCw, X } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: any) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onScanFailure }) => {
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isInitializing, setIsInitializing] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<{ text: string, time: number } | null>(null);
  const readerId = "barcode-scanner-container";

  const onScanSuccessRef = useRef(onScanSuccess);
  const onScanFailureRef = useRef(onScanFailure);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
    onScanFailureRef.current = onScanFailure;
  }, [onScanSuccess, onScanFailure]);

  useEffect(() => {
    let isMounted = true;
    let scanner: Html5Qrcode | null = null;
    
    const init = async () => {
      if (!isMounted) return;
      setIsInitializing(true);
      
      // Add a small delay to ensure any previous camera sessions are released
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!isMounted) return;

      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        onScanFailureRef.current?.("Camera access is not supported in this browser context (possibly due to security restrictions or an insecure connection).");
        setIsInitializing(false);
        return;
      }

      try {
        // Add timeout to getCameras
        const devices = await Promise.race([
          Html5Qrcode.getCameras(),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout getting cameras")), 5000))
        ]).catch(err => {
          console.warn("Could not get cameras or timed out", err);
          return [];
        });

        if (isMounted && devices && devices.length > 1) {
          setHasMultipleCameras(true);
        }
      } catch (err) {
        console.warn("Error in getCameras block", err);
      }

      if (!isMounted) return;

      try {
        scanner = new Html5Qrcode(readerId, {
          verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.QR_CODE
          ]
        });
        scannerRef.current = scanner;
        
        // Add timeout to scanner.start
        await Promise.race([
          scanner.start(
            { facingMode },
            {
              fps: 30,
              qrbox: { width: 280, height: 160 },
              aspectRatio: 1.0,
              disableFlip: true,
              videoConstraints: {
                facingMode
              }
            } as any,
            (decodedText) => {
              const now = Date.now();
              if (lastScanRef.current && lastScanRef.current.text === decodedText && now - lastScanRef.current.time < 2000) {
                return;
              }
              lastScanRef.current = { text: decodedText, time: now };

              if (isMounted && scanner?.isScanning) {
                try {
                  scanner.pause();
                } catch (e) {
                  console.warn("Pause not supported or failed", e);
                }
                onScanSuccessRef.current(decodedText);
              }
            },
            () => {} // Silence frame errors
          ),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout starting scanner")), 10000))
        ]);
      } catch (err: any) {
        console.error("Failed to start scanner:", err);
        const errMsg = err?.message || String(err);
        const lowerMsg = errMsg.toLowerCase();
        const isPermissionError = 
          err?.name === 'NotAllowedError' || 
          err?.name === 'PermissionDeniedError' ||
          lowerMsg.includes('notallowederror') ||
          lowerMsg.includes('permissiondeniederror') ||
          lowerMsg.includes('permission denied') ||
          lowerMsg.includes('notallowed');

        const isInUseError = 
          err?.name === 'NotReadableError' || 
          lowerMsg.includes('notreadableerror') ||
          lowerMsg.includes('could not start video source') ||
          lowerMsg.includes('in use');

        if (isPermissionError) {
          onScanFailureRef.current?.("Camera permission is required to scan barcodes. Please click 'Allow' when prompted by your browser, or check your site settings (usually the lock icon next to the URL) to enable camera access.");
        } else if (isInUseError) {
          onScanFailureRef.current?.("Camera is already in use by another application or tab. Please close other camera apps and try again, or try opening in a new tab.");
        } else {
          onScanFailureRef.current?.("Failed to start scanner: " + (errMsg || "Unknown error or timeout") + ". Please ensure you have granted camera permission.");
        }
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (scanner) {
        const s = scanner;
        // Immediate clear to prevent further processing
        try { s.clear(); } catch (e) {}
        
        // Asynchronous stop
        (async () => {
          try {
            if (s.isScanning) {
              await s.stop();
            }
          } catch (err) {
            console.error("Error during scanner cleanup:", err);
          }
        })();
      }
    };
  }, [facingMode]);

  const handleFlip = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {isInitializing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-[120] bg-black">
          <div className="w-12 h-12 border-2 border-zinc-800 border-t-white rounded-full animate-spin" />
        </div>
      )}
      
      <div 
        id={readerId} 
        className="absolute inset-0 w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full [&>video]:absolute [&>video]:inset-0 [&_span]:!hidden [&_p]:!hidden [&_div:not(.html5-qrcode-element)]:!hidden" 
      />
      
      {/* Simple Overlay Mask */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
        {/* Top Controls */}
        <div className="p-6 pt-safe flex items-center justify-between pointer-events-auto">
          <button 
            onClick={() => onScanFailureRef.current?.("CANCELLED")}
            className="p-2 text-white"
          >
            <X size={32} />
          </button>
          {hasMultipleCameras && (
            <button 
              onClick={handleFlip}
              disabled={isInitializing}
              className="p-2 text-white disabled:opacity-0"
            >
              <RefreshCw size={28} className={isInitializing ? "animate-spin" : ""} />
            </button>
          )}
        </div>

        {/* Scanning area with simple rectangle */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-72 h-44 border-2 border-white/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
        </div>
      </div>
    </div>
  );
};


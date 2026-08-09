import React, { useState, useRef, useEffect } from 'react';
import { QrCode, CheckCircle2, Camera, Upload, StopCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useCheckInTicket } from '../../hooks/useOrganizer';
import { useOrganizerEvents } from '../../hooks/useEvents';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export const QRScannerPage: React.FC = () => {
  const toast = useToast();
  const { data: events = [] } = useOrganizerEvents();
  const checkInMutation = useCheckInTicket();

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [manualCode, setManualCode] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const eventOptions = [
    { value: '', label: 'Select an event to scan for' },
    ...events.map((e) => ({ value: e.id, label: e.title })),
  ];

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    }
    setIsScanning(false);
  };

  const startScanner = async () => {
    if (!selectedEventId) {
      toast.warning('Please select a target event first before starting camera scanner.');
      return;
    }

    try {
      setIsScanning(true);
      const html5Qrcode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          setManualCode(decodedText);
          toast.success('QR Code scanned! Verifying attendee ticket...');
          stopScanner();
          checkInMutation.mutate({
            eventId: parseInt(selectedEventId, 10),
            qrPayload: decodedText,
          });
        },
        () => {
          // Frame scan failures ignored until valid QR code is found
        }
      );
    } catch (err) {
      toast.error('Unable to access camera. Check device permissions.');
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedEventId) {
      toast.warning('Please select a target event first before scanning an image.');
      return;
    }

    try {
      const html5Qrcode = new Html5Qrcode('qr-reader-file-temp');
      const decodedText = await html5Qrcode.scanFile(file, true);
      setManualCode(decodedText);
      toast.success('QR Code detected in image! Verifying ticket...');
      checkInMutation.mutate({
        eventId: parseInt(selectedEventId, 10),
        qrPayload: decodedText,
      });
    } catch {
      toast.error('Could not detect a valid QR code in the uploaded image.');
    }
  };

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !manualCode) return;

    checkInMutation.mutate({
      eventId: parseInt(selectedEventId, 10),
      qrPayload: manualCode,
    });
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Hidden container for temp file scan */}
      <div id="qr-reader-file-temp" className="hidden" />

      <div>
        <h1 className="text-2xl font-black text-slate-900 font-heading">QR Check-in Scanner</h1>
        <p className="text-xs text-slate-600 font-medium">Scan camera live, upload ticket image, or enter JWT payload</p>
      </div>

      <Card className="border border-slate-300 shadow-md bg-[#F3F4F6]">
        <CardHeader className="border-b border-slate-300">
          <CardTitle className="text-base font-black text-slate-900 font-heading">1. Select Target Event</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Select
            options={eventOptions}
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card className="border border-slate-300 shadow-md bg-[#F3F4F6]">
        <CardHeader className="border-b border-slate-300 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-black text-slate-900 font-heading">2. Interactive QR Scanner</CardTitle>
          <div className="flex items-center gap-2">
            {!isScanning ? (
              <Button size="sm" onClick={startScanner} className="gap-1 text-xs">
                <Camera className="w-3.5 h-3.5" />
                Open Camera
              </Button>
            ) : (
              <Button size="sm" variant="danger" onClick={stopScanner} className="gap-1 text-xs">
                <StopCircle className="w-3.5 h-3.5" />
                Stop Camera
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {/* Camera Video Stream Container */}
          <div className="w-full max-w-sm mx-auto bg-slate-900 rounded-3xl overflow-hidden border-4 border-karyakram-red-600 relative shadow-2xl min-h-[260px] flex items-center justify-center">
            <div id="qr-reader" className="w-full h-full min-h-[260px]" />

            {!isScanning && (
              <div className="absolute inset-0 bg-slate-900/90 p-6 flex flex-col items-center justify-center text-white text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-3 border border-slate-700">
                  <QrCode className="w-7 h-7 text-karyakram-gold-600" />
                </div>
                <p className="text-sm font-black text-white">Camera Scanner Offline</p>
                <p className="text-xs font-bold text-slate-300 mt-1">Click "Open Camera" above to start live scanning</p>
              </div>
            )}
          </div>

          {/* Alternative Image File Upload Scanner */}
          <div className="p-4 bg-white border border-slate-300 rounded-2xl text-center space-y-2">
            <span className="text-xs font-bold text-slate-900 block">Have a screenshot of ticket QR?</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 text-xs font-bold text-slate-900 border-slate-300"
            >
              <Upload className="w-3.5 h-3.5 text-karyakram-red-600" />
              Upload & Scan Ticket Image
            </Button>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualCheckIn} className="space-y-3 pt-2 border-t border-slate-300">
            <Input
              label="Scanned Ticket Code / JWT Payload"
              placeholder="Paste ticket JWT payload..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />

            <Button
              type="submit"
              disabled={!selectedEventId || !manualCode}
              isLoading={checkInMutation.isPending}
              className="w-full gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Check In Attendee
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

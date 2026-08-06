import React, { useState } from 'react';
import { QrCode, CheckCircle2 } from 'lucide-react';
import { useCheckInTicket } from '../../hooks/useOrganizer';
import { useOrganizerEvents } from '../../hooks/useEvents';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export const QRScannerPage: React.FC = () => {
  const { data: events = [] } = useOrganizerEvents();
  const checkInMutation = useCheckInTicket();

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [manualCode, setManualCode] = useState<string>('');

  const eventOptions = [
    { value: '', label: 'Select an event to scan for' },
    ...events.map((e) => ({ value: e.id, label: e.title })),
  ];

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !manualCode) return;

    checkInMutation.mutate({
      eventId: parseInt(selectedEventId, 10),
      qrPayload: manualCode,
    });
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">QR Check-in Scanner</h1>
        <p className="text-xs text-slate-500">Scan or enter signed ticket JWT payload at the venue door</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Select Target Event</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            options={eventOptions}
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Ticket Payload Scanner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Visual Scanner Area */}
          <div className="aspect-square w-full max-w-xs mx-auto bg-slate-900 rounded-3xl p-6 flex flex-col items-center justify-center text-white text-center border-4 border-indigo-500/30 relative overflow-hidden shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 flex items-center justify-center mb-3 animate-pulse">
              <QrCode className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="text-xs font-semibold text-indigo-200">Point Camera at Ticket QR</p>
            <p className="text-[10px] text-slate-400 mt-1">Or paste signed JWT payload below</p>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualCheckIn} className="space-y-3">
            <Input
              label="Scanned QR Payload String"
              placeholder="Paste JWT string..."
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

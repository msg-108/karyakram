import React from 'react';
import { Calendar, MapPin, Download } from 'lucide-react';
import { Ticket } from '../../types/booking.types';
import { QRDisplay } from './QRDisplay';
import { Button } from '../ui/Button';
import { featureFlags } from '../../config/featureFlags';
import { useToast } from '../../context/ToastContext';

export interface TicketPassProps {
  ticket: Ticket;
  eventTitle?: string;
  eventDate?: string;
  eventVenue?: string;
}

export const TicketPass: React.FC<TicketPassProps> = ({
  ticket,
  eventTitle = 'Karyakram Event',
  eventDate,
  eventVenue,
}) => {
  const toast = useToast();

  const handleDownloadReceipt = () => {
    if (!featureFlags.RECEIPT_DOWNLOAD_ENABLED) {
      toast.info('Receipt PDF export feature is coming soon.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col md:flex-row my-4">
      {/* Left Details */}
      <div className="p-6 flex-1 space-y-4 border-b md:border-b-0 md:border-r border-slate-100">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Official Ticket Pass</span>
          <h3 className="text-xl font-black text-slate-900 leading-tight">{eventTitle}</h3>
        </div>

        <div className="space-y-2 text-xs text-slate-600">
          {eventDate && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-semibold">{eventDate}</span>
            </div>
          )}
          {eventVenue && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{eventVenue}</span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-slate-400 font-medium">Attendee</p>
            <p className="font-bold text-slate-900 truncate">{ticket.attendee_name}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Ticket Tier</p>
            <p className="font-bold text-indigo-600">{ticket.booking_item?.ticket_tier_name || 'Standard'}</p>
          </div>
        </div>

        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={handleDownloadReceipt} className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" />
            Download Receipt
          </Button>
        </div>
      </div>

      {/* Right QR Section */}
      <div className="p-6 bg-slate-50 flex items-center justify-center shrink-0">
        <QRDisplay
          ticketId={ticket.id}
          qrPayload={ticket.qr_code_payload}
          attendeeName={ticket.attendee_name}
          tierName={ticket.booking_item?.ticket_tier_name || 'General'}
          status={ticket.status}
        />
      </div>
    </div>
  );
};

import React from 'react';
import { Calendar, MapPin, Download } from 'lucide-react';
import { Ticket } from '../../types/booking.types';
import { QRDisplay } from './QRDisplay';
import { Button } from '../ui/Button';
import { featureFlags } from '../../config/featureFlags';
import { useToast } from '../../context/ToastContext';

import { downloadTicketPass } from '../../lib/downloadTicket';

import { formatDateTime } from '../../lib/formatters';

export interface TicketPassProps {
  ticket: Ticket;
  eventTitle?: string;
  eventDate?: string;
  eventVenue?: string;
}

export const TicketPass: React.FC<TicketPassProps> = ({
  ticket,
  eventTitle,
  eventDate,
  eventVenue,
}) => {
  const toast = useToast();

  const resolvedTitle =
    ticket.event_title ||
    (ticket as any).booking?.event_title ||
    (ticket as any).booking?.event?.title ||
    eventTitle ||
    'Karyakram Event';

  const rawDate =
    ticket.event_start_datetime ||
    (ticket as any).booking?.event_start_datetime ||
    (ticket as any).booking?.event?.start_datetime;

  const resolvedDate = rawDate ? formatDateTime(rawDate) : eventDate;

  const resolvedVenue =
    ticket.event_venue ||
    ticket.event_address ||
    (ticket as any).booking?.event_venue ||
    (ticket as any).booking?.event?.venue ||
    eventVenue ||
    'Main Venue';

  const handleDownloadPass = async () => {
    try {
      toast.info('Generating high-resolution digital ticket pass...');
      await downloadTicketPass({
        ticketId: ticket.id,
        qrPayload: ticket.qr_code_payload,
        eventTitle: resolvedTitle,
        eventDate: resolvedDate,
        eventVenue: resolvedVenue,
        attendeeName: ticket.attendee_name,
        tierName: ticket.booking_item?.ticket_tier_name || 'General Admission',
        status: ticket.status,
      });
      toast.success('Ticket pass PNG downloaded successfully!');
    } catch {
      toast.error('Failed to generate ticket pass image.');
    }
  };

  return (
    <div className="bg-[#F3F4F6] rounded-2xl border border-slate-300 shadow-md overflow-hidden flex flex-col md:flex-row my-4">
      {/* Left Details */}
      <div className="p-6 flex-1 space-y-4 border-b md:border-b-0 md:border-r border-slate-300">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-karyakram-red-600">Official Ticket Pass</span>
          <h3 className="text-xl font-black text-slate-900 leading-tight font-heading">{resolvedTitle}</h3>
        </div>

        <div className="space-y-2 text-xs text-slate-700">
          {resolvedDate && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-karyakram-red-600 shrink-0" />
              <span className="font-bold text-slate-900">{resolvedDate}</span>
            </div>
          )}
          {resolvedVenue && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-karyakram-red-600 shrink-0" />
              <span className="font-semibold text-slate-800">{resolvedVenue}</span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-300 grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-slate-600 font-medium">Attendee</p>
            <p className="font-extrabold text-slate-900 truncate">{ticket.attendee_name}</p>
          </div>
          <div>
            <p className="text-slate-600 font-medium">Ticket Tier</p>
            <p className="font-extrabold text-slate-900">{ticket.booking_item?.ticket_tier_name || 'Standard'}</p>
          </div>
        </div>

        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={handleDownloadPass} className="gap-1.5 text-xs font-bold text-slate-900 border-slate-300">
            <Download className="w-3.5 h-3.5 text-karyakram-red-600" />
            Download Ticket Pass PNG
          </Button>
        </div>
      </div>

      {/* Right QR Section */}
      <div className="p-6 bg-[#F3F4F6] flex items-center justify-center shrink-0 border-t md:border-t-0 border-slate-300">
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

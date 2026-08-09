import React from 'react';
import { BookingItem } from '../../types/booking.types';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export interface BookingSummaryProps {
  eventTitle: string;
  eventStartDatetime: string;
  eventVenue?: string;
  items: BookingItem[] | Array<{ ticket_tier_name: string; quantity: number; price_at_purchase?: string; subtotal?: string }>;
  totalAmount: string | number;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  eventTitle,
  eventStartDatetime,
  eventVenue,
  items,
  totalAmount,
}) => {
  return (
    <Card className="border-karyakram-purple-200/60 bg-white shadow-xl shadow-slate-200/40">
      <CardHeader className="bg-karyakram-purple-50/50 border-b border-karyakram-purple-200/40">
        <CardTitle className="text-base font-black text-karyakram-purple-900 font-heading">Order Summary</CardTitle>
        <p className="text-xs font-bold text-slate-800">{eventTitle}</p>
        <p className="text-xs text-karyakram-purple-800 font-semibold">{formatDateTime(eventStartDatetime)}</p>
        {eventVenue && <p className="text-xs text-slate-500">{eventVenue}</p>}
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Line Items */}
        <div className="space-y-2.5 divide-y divide-slate-100">
          {items.map((item, index) => (
            <div key={index} className="pt-2.5 first:pt-0 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900">{item.ticket_tier_name}</span>
                <span className="text-slate-500 ml-1.5 font-semibold">x{item.quantity}</span>
              </div>
              <span className="font-extrabold text-slate-900">
                {formatCurrency(item.subtotal || item.price_at_purchase)}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900">Total Amount</span>
          <span className="text-2xl font-black text-karyakram-purple-900 font-heading">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { StatusBadge } from '../common/StatusBadge';
import { TicketStatusEnum } from '../../types/common.types';

export interface QRDisplayProps {
  ticketId: string;
  qrPayload?: string;
  attendeeName: string;
  tierName: string;
  status: TicketStatusEnum;
}

export const QRDisplay: React.FC<QRDisplayProps> = ({
  ticketId,
  qrPayload,
  attendeeName,
  tierName,
  status,
}) => {
  const codeValue = qrPayload || ticketId;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-[#F3F4F6] rounded-2xl border border-slate-300 shadow-sm space-y-4 text-center">
      <div className="p-4 bg-white border border-slate-300 rounded-2xl shadow-inner">
        <QRCodeSVG value={codeValue} size={180} level="H" includeMargin={true} data-ticket-id={ticketId} />
      </div>

      <div className="space-y-1">
        <StatusBadge status={status} />
        <h4 className="text-sm font-black text-slate-900 pt-1">{attendeeName}</h4>
        <p className="text-xs text-slate-900 font-bold">{tierName}</p>
        <p className="text-xs font-mono text-slate-900 font-bold">ID: {ticketId}</p>
      </div>
    </div>
  );
};

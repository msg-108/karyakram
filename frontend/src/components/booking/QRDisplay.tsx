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
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 text-center">
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner">
        <QRCodeSVG value={codeValue} size={180} level="H" includeMargin={true} />
      </div>

      <div className="space-y-1">
        <StatusBadge status={status} />
        <h4 className="text-sm font-bold text-slate-900 pt-1">{attendeeName}</h4>
        <p className="text-xs text-indigo-600 font-semibold">{tierName}</p>
        <p className="text-[10px] font-mono text-slate-400">ID: {ticketId}</p>
      </div>
    </div>
  );
};

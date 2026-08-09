import React, { useState } from 'react';
import { usePendingEvents, useAdminEventDetail, useApproveOrRejectEvent, usePublishEvent } from '../../hooks/useAdmin';
import { DataTable, Column } from '../../components/dashboard/DataTable';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/forms/FormField';
import { AdminEventReview } from '../../types/dashboard.types';
import { formatDateTime, formatCurrency } from '../../lib/formatters';
import { CheckCircle2, XCircle, Globe, MapPin, Calendar, Users, FileText, DollarSign } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

export const PendingEventsPage: React.FC = () => {
  const { data: events = [], isLoading } = usePendingEvents();
  const actionMutation = useApproveOrRejectEvent();
  const publishMutation = usePublishEvent();

  const [selectedEvent, setSelectedEvent] = useState<AdminEventReview | null>(null);
  const [reason, setReason] = useState('');

  const { data: eventDetail, isLoading: isDetailLoading } = useAdminEventDetail(selectedEvent?.id || null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleAction = (action: 'approve' | 'reject') => {
    if (!selectedEvent) return;

    actionMutation.mutate(
      {
        eventId: selectedEvent.id,
        data: { action, reason },
      },
      {
        onSuccess: () => {
          setSelectedEvent(null);
          setReason('');
        },
      }
    );
  };

  const handlePublish = (eventId: number) => {
    publishMutation.mutate(eventId, {
      onSuccess: () => setSelectedEvent(null),
    });
  };

  const columns: Column<AdminEventReview>[] = [
    {
      header: 'Event Title',
      accessor: (row) => (
        <div className="space-y-0.5 max-w-[220px]">
          <span className="font-bold text-slate-900 block truncate">{row.title}</span>
          <span className="text-xs text-slate-900 font-bold block">{row.category?.name}</span>
        </div>
      ),
    },
    { header: 'Organizer', accessor: (row) => row.organizer_name },
    { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
    { header: 'Start Time', accessor: (row) => formatDateTime(row.start_datetime) },
    {
      header: 'Action',
      accessor: (row) => (
        <Button size="sm" variant="outline" onClick={() => setSelectedEvent(row)}>
          Review Event
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-heading">Pending Events Queue</h1>
        <p className="text-xs text-slate-600 font-medium">Review submitted organizer events, approve content, and publish live</p>
      </div>

      <DataTable
        columns={columns}
        data={events}
        keyExtractor={(row) => row.id}
        emptyText="No events currently waiting in admin review queue."
      />

      {/* Review Modal */}
      {selectedEvent && (
        <Modal isOpen={Boolean(selectedEvent)} onClose={() => setSelectedEvent(null)} title="Review Event Submission" maxWidth="4xl">
          <div className="space-y-5 text-xs max-h-[75vh] overflow-y-auto pr-1">
            {isDetailLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                {/* Banner preview if available */}
                {(eventDetail?.banner || selectedEvent) && (
                  <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video max-h-56 border border-slate-200 shadow-2xs">
                    {eventDetail?.banner ? (
                      <img src={eventDetail.banner} alt={eventDetail.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">No Banner Uploaded</div>
                    )}
                    <div className="absolute top-2 right-2">
                      <StatusBadge status={eventDetail?.status || selectedEvent.status} />
                    </div>
                  </div>
                )}

                {/* Header & Basic Info */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-sm">{eventDetail?.title || selectedEvent.title}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800">
                      {eventDetail?.category?.name || selectedEvent.category?.name}
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium">
                    Organized by: <strong className="text-slate-900">{eventDetail?.organizer_name || selectedEvent.organizer_name}</strong> {eventDetail?.organizer_email && `(${eventDetail.organizer_email})`}
                  </p>
                </div>

                {/* Event Schedule & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span>Schedule</span>
                    </div>
                    <p className="text-slate-600">Start: <span className="font-bold text-slate-800">{formatDateTime(eventDetail?.start_datetime || selectedEvent.start_datetime)}</span></p>
                    {eventDetail?.end_datetime && (
                      <p className="text-slate-600">End: <span className="font-bold text-slate-800">{formatDateTime(eventDetail.end_datetime)}</span></p>
                    )}
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      <span>Location & Venue</span>
                    </div>
                    <p className="font-bold text-slate-800">{eventDetail?.venue || 'Venue TBD'}</p>
                    <p className="text-slate-600">{[eventDetail?.address, eventDetail?.city].filter(Boolean).join(', ')}</p>
                  </div>
                </div>

                {/* Event Descriptions */}
                {eventDetail && (
                  <div className="space-y-3">
                    {eventDetail.short_description && (
                      <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl">
                        <span className="font-bold text-purple-900 uppercase text-[10px] tracking-wide block mb-1">Short Tagline</span>
                        <p className="text-slate-700 font-medium">{eventDetail.short_description}</p>
                      </div>
                    )}

                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs mb-1">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span>Full Description</span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-line leading-relaxed">{eventDetail.description}</p>
                    </div>

                    {eventDetail.terms_and_conditions && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wide block mb-1">Terms & Conditions</span>
                        <p className="text-slate-600 whitespace-pre-line">{eventDetail.terms_and_conditions}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Ticket Tiers */}
                {eventDetail?.ticket_tiers && eventDetail.ticket_tiers.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-purple-600" />
                        <span>Ticket Tiers ({eventDetail.ticket_tiers.length})</span>
                      </div>
                      <span className="flex items-center gap-1 text-slate-500 font-normal">
                        <Users className="w-3.5 h-3.5" /> Total Capacity: <strong>{(
                          eventDetail.ticket_tiers.reduce((acc, tier) => acc + (tier.quantity || 0), 0)
                        ).toLocaleString()}</strong>
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                      {eventDetail.ticket_tiers.map((tier) => (
                        <div key={tier.id} className="p-3 bg-white flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 block">{tier.name}</span>
                            {tier.description && <span className="text-[11px] text-slate-500 block">{tier.description}</span>}
                          </div>
                          <div className="text-right">
                            <span className="font-black text-slate-900 text-sm block">{formatCurrency(tier.price)}</span>
                            <span className="text-[11px] text-slate-500 block">{tier.quantity} tickets available</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <FormField
                  as="textarea"
                  rows={2}
                  label="Rejection Reason (Required if rejecting)"
                  placeholder="e.g. Terms violate platform guidelines"
                  value={reason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                />

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                  {selectedEvent.status === 'SUBMITTED' && (
                    <>
                      <Button
                        variant="danger"
                        className="flex-1 gap-1"
                        isLoading={actionMutation.isPending}
                        onClick={() => handleAction('reject')}
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Event
                      </Button>

                      <Button
                        className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700"
                        isLoading={actionMutation.isPending}
                        onClick={() => handleAction('approve')}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve Event
                      </Button>
                    </>
                  )}

                  {selectedEvent.status === 'APPROVED' && (
                    <Button
                      className="w-full gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                      isLoading={publishMutation.isPending}
                      onClick={() => handlePublish(selectedEvent.id)}
                    >
                      <Globe className="w-4 h-4" />
                      Publish Live to Public Homepage
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

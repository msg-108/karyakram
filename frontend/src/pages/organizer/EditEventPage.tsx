import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrganizerEventDetail } from '../../hooks/useEvents';
import { Spinner } from '../../components/ui/Spinner';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AlertCircle } from 'lucide-react';

export const EditEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const eventId = id ? parseInt(id, 10) : 0;
  const { data: event, isLoading, error } = useOrganizerEventDetail(eventId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-700">
        <p className="font-semibold text-sm">Event not found or not editable.</p>
        <Button onClick={() => navigate('/organizer/events')} className="mt-4">
          Back to Events
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Edit Event: {event.title}</h1>
        <p className="text-xs text-slate-500">
          Status: <span className="font-bold uppercase text-indigo-600">{event.status}</span>
        </p>
      </div>

      {event.rejection_reason && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-amber-950">Rejection Reason from Admin</h4>
            <p>{event.rejection_reason}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manage Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-slate-500">
            Editing draft events or adjusting ticket tiers can be done directly from this control panel.
          </p>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => navigate('/organizer/events')}>
              Back to My Events
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

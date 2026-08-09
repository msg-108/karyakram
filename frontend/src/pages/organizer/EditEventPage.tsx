import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOrganizerEventDetail, usePublicCategories } from '../../hooks/useEvents';
import { eventService } from '../../services/event.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../config/queryClient';
import { updateEventSchema, UpdateEventFormData } from '../../schemas/event.schema';
import { FormField } from '../../components/forms/FormField';
import { Spinner } from '../../components/ui/Spinner';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../lib/api';
import { formatForDateTimeLocal, addHoursToDateTimeLocal } from '../../lib/formatters';

export const EditEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const eventId = id ? parseInt(id, 10) : 0;
  const { data: event, isLoading, error } = useOrganizerEventDetail(eventId);
  const { data: categories = [] } = usePublicCategories();

  const updateMutation = useMutation({
    mutationFn: (data: Partial<UpdateEventFormData>) => eventService.updateOrganizerEvent(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizer.events() });
      queryClient.invalidateQueries({ queryKey: queryKeys.organizer.eventDetail(eventId) });
      toast.success('Event updated successfully!');
      navigate('/organizer/events');
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateEventFormData>({
    resolver: zodResolver(updateEventSchema),
  });

  const startDatetime = watch('start_datetime');

  useEffect(() => {
    if (event) {
      reset({
        title: event.title,
        short_description: event.short_description || '',
        description: event.description,
        terms_and_conditions: event.terms_and_conditions || '',
        category: event.category?.id || 1,
        venue: event.venue,
        address: event.address || '',
        city: event.city,
        start_datetime: formatForDateTimeLocal(event.start_datetime),
        end_datetime: formatForDateTimeLocal(event.end_datetime),
        capacity: event.capacity || 100,
        visibility: event.visibility || 'PUBLIC',
      });
    }
  }, [event, reset]);

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

  const categoriesList = Array.isArray(categories) ? categories : (categories as any)?.results || [];
  const categoryOptions = [
    { value: '', label: 'Select a category' },
    ...categoriesList.map((c: any) => ({ value: c.id, label: c.name })),
  ];

  const visibilityOptions = [
    { value: 'PUBLIC', label: 'Public (Listed on homepage)' },
    { value: 'UNLISTED', label: 'Unlisted (Link access only)' },
  ];

  const onFormInvalid = (fieldErrors: any) => {
    const firstError = Object.values(fieldErrors)[0] as any;
    toast.warning(firstError?.message || 'Please check and fix the required fields below.');
  };

  const onSubmit = (data: UpdateEventFormData) => {
    updateMutation.mutate(data);
  };

  const totalErrorsCount = Object.keys(errors).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-heading">Edit Event: {event.title}</h1>
        <p className="text-xs text-slate-600 font-medium">
          Status: <span className="font-bold uppercase text-karyakram-purple-800">{event.status}</span>
        </p>
      </div>

      {/* Warning Callout when validation fails */}
      {totalErrorsCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-amber-900 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-extrabold text-amber-950 text-sm">
              Form Validation Warning ({totalErrorsCount} field{totalErrorsCount > 1 ? 's' : ''} need attention)
            </h4>
            <p className="font-medium text-amber-800">
              Please review the highlighted fields in the form below before saving changes.
            </p>
            <ul className="list-disc list-inside space-y-0.5 font-bold text-amber-900 pt-1">
              {errors.title && <li>Event Title: {errors.title.message}</li>}
              {errors.category && <li>Category: {errors.category.message}</li>}
              {errors.short_description && <li>Short Summary: {errors.short_description.message}</li>}
              {errors.description && <li>Full Description: {errors.description.message}</li>}
              {errors.start_datetime && <li>Start Date & Time: {errors.start_datetime.message}</li>}
              {errors.end_datetime && <li>End Date & Time: {errors.end_datetime.message}</li>}
              {errors.venue && <li>Venue: {errors.venue.message}</li>}
              {errors.address && <li>Address: {errors.address.message}</li>}
              {errors.city && <li>City: {errors.city.message}</li>}
            </ul>
          </div>
        </div>
      )}

      {event.rejection_reason && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-extrabold text-amber-900">Rejection Reason from Admin</h4>
            <p>{event.rejection_reason}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event Details & Location</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit, onFormInvalid)} className="space-y-4">
            <FormField label="Event Title" {...register('title')} error={errors.title?.message} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                as="select"
                label="Category"
                options={categoryOptions}
                {...register('category', { valueAsNumber: true })}
                error={errors.category?.message}
              />
              <FormField
                as="select"
                label="Visibility"
                options={visibilityOptions}
                {...register('visibility')}
              />
            </div>

            <FormField label="Short Summary" {...register('short_description')} error={errors.short_description?.message} />
            <FormField as="textarea" rows={4} label="Full Description" {...register('description')} error={errors.description?.message} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <FormField
                label="Start Date & Time"
                type="datetime-local"
                {...register('start_datetime')}
                error={errors.start_datetime?.message}
              />
              <FormField
                label="End Date & Time"
                type="datetime-local"
                min={startDatetime}
                {...register('end_datetime')}
                error={errors.end_datetime?.message}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <FormField label="Venue Name" {...register('venue')} error={errors.venue?.message} />
              <FormField label="Street Address" {...register('address')} error={errors.address?.message} />
              <FormField label="City" {...register('city')} error={errors.city?.message} />
            </div>

            <FormField as="textarea" rows={3} label="Terms & Conditions (Optional)" {...register('terms_and_conditions')} />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/organizer/events')} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" isLoading={updateMutation.isPending} className="flex-1">
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

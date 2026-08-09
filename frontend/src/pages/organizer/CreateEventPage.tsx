import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { createEventSchema, CreateEventFormData, TicketTierInputData } from '../../schemas/event.schema';
import { useCreateEvent, useSubmitEvent, usePublicCategories } from '../../hooks/useEvents';
import { FormField } from '../../components/forms/FormField';
import { TicketTierForm } from '../../components/forms/TicketTierForm';
import { FileDropzone } from '../../components/forms/FileDropzone';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';
import { formatForDateTimeLocal, addHoursToDateTimeLocal } from '../../lib/formatters';

const getTicketTierWarning = (ticketTiersErr: any): string => {
  if (!ticketTiersErr) return 'At least one ticket tier is required.';
  if (typeof ticketTiersErr.message === 'string') return ticketTiersErr.message;
  if (typeof ticketTiersErr.root?.message === 'string') return ticketTiersErr.root.message;
  if (Array.isArray(ticketTiersErr)) {
    for (let i = 0; i < ticketTiersErr.length; i++) {
      const item = ticketTiersErr[i];
      if (item?.name?.message) return `Tier #${i + 1} Name: ${item.name.message}`;
      if (item?.price?.message) return `Tier #${i + 1} Price: ${item.price.message}`;
      if (item?.quantity?.message) return `Tier #${i + 1} Quantity: ${item.quantity.message}`;
    }
  }
  return 'At least one valid ticket tier is required.';
};

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const createEventMutation = useCreateEvent();
  const submitEventMutation = useSubmitEvent();
  const { data: categories = [] } = usePublicCategories();

  const [step, setStep] = useState(1);

  const nowString = formatForDateTimeLocal(new Date());

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitted },
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      capacity: 100,
      visibility: 'PUBLIC',
      ticket_tiers: [
        { name: 'General Admission', description: '', price: '500', quantity: 100, display_order: 0, is_active: true },
      ],
    },
  });

  const startDatetime = watch('start_datetime');
  const ticketTiers = watch('ticket_tiers');

  const categoriesList = Array.isArray(categories)
    ? categories
    : (categories as any)?.results || [];

  const categoryOptions = [
    { value: '', label: 'Select a category' },
    ...categoriesList.map((c: any) => ({ value: c.id, label: c.name })),
  ];

  const visibilityOptions = [
    { value: 'PUBLIC', label: 'Public (Listed on homepage)' },
    { value: 'UNLISTED', label: 'Unlisted (Link access only)' },
  ];

  const handleNextStep = async () => {
    const isStep1Valid = await trigger([
      'title',
      'short_description',
      'description',
      'category',
      'venue',
      'address',
      'city',
      'start_datetime',
      'end_datetime',
    ]);

    if (isStep1Valid) {
      setStep(2);
    } else {
      toast.warning('Please fix the highlighted required fields before moving to ticket tiers.');
    }
  };

  const onFormInvalid = (fieldErrors: any) => {
    const step1Keys = ['title', 'short_description', 'description', 'category', 'venue', 'address', 'city', 'start_datetime', 'end_datetime'];
    const hasStep1Error = step1Keys.some((key) => Boolean(fieldErrors[key]));

    if (hasStep1Error) {
      setStep(1);
    }

    const firstError = Object.values(fieldErrors)[0] as any;
    toast.warning(firstError?.message || 'Please check and fill in all required fields.');
  };

  const onSaveDraft = (data: CreateEventFormData) => {
    createEventMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Event saved as draft!');
        navigate('/organizer/events');
      },
    });
  };

  const onSubmitForReview = (data: CreateEventFormData) => {
    createEventMutation.mutate(data, {
      onSuccess: (event) => {
        submitEventMutation.mutate(event.id, {
          onSuccess: () => {
            toast.success('Event submitted for admin review!');
            navigate('/organizer/events');
          },
        });
      },
    });
  };

  const hasStep1Errors = Boolean(
    errors.title ||
      errors.short_description ||
      errors.description ||
      errors.category ||
      errors.venue ||
      errors.address ||
      errors.city ||
      errors.start_datetime ||
      errors.end_datetime
  );

  const hasStep2Errors = Boolean(errors.ticket_tiers || errors.banner);

  const totalErrorsCount = Object.keys(errors).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-heading">Create New Event</h1>
        <p className="text-xs text-slate-600 font-medium">Fill in event details, add ticket tiers, and save as draft</p>
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
              Please review the highlighted fields in the form below before submitting.
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
              {errors.ticket_tiers && <li>Ticket Tiers: {getTicketTierWarning(errors.ticket_tiers)}</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Step Indicator */}
      <div className="flex items-center justify-between border-b border-slate-300 pb-3 text-xs font-bold">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`pb-1 cursor-pointer flex items-center gap-1.5 ${
            step === 1 ? 'border-b-2 border-karyakram-red-600 text-slate-900 font-black' : 'text-slate-600 font-bold'
          }`}
        >
          <span>1. Basic Details & Venue</span>
          {hasStep1Errors && isSubmitted && (
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" title="Has Errors" />
          )}
        </button>
        <button
          type="button"
          onClick={handleNextStep}
          className={`pb-1 cursor-pointer flex items-center gap-1.5 ${
            step === 2 ? 'border-b-2 border-karyakram-red-600 text-slate-900 font-black' : 'text-slate-600 font-bold'
          }`}
        >
          <span>2. Ticket Tiers & Banner</span>
          {hasStep2Errors && isSubmitted && (
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" title="Has Errors" />
          )}
        </button>
      </div>

      <form className="space-y-6">
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Details & Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Event Title" placeholder="e.g. Nepal Tech Summit 2026" {...register('title')} error={errors.title?.message} />

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

              <FormField label="Short Summary" placeholder="Brief tagline shown in card results" {...register('short_description')} error={errors.short_description?.message} />
              <FormField as="textarea" rows={4} label="Full Description" placeholder="Detailed event schedule, speaker info, etc." {...register('description')} error={errors.description?.message} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <FormField
                  label="Start Date & Time"
                  type="datetime-local"
                  min={nowString}
                  {...register('start_datetime')}
                  error={errors.start_datetime?.message}
                />
                <FormField
                  label="End Date & Time"
                  type="datetime-local"
                  min={startDatetime || nowString}
                  {...register('end_datetime')}
                  error={errors.end_datetime?.message}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <FormField label="Venue Name" placeholder="Pragya Bhawan" {...register('venue')} error={errors.venue?.message} />
                <FormField label="Street Address" placeholder="Kamaladi" {...register('address')} error={errors.address?.message} />
                <FormField label="City" placeholder="Kathmandu" {...register('city')} error={errors.city?.message} />
              </div>

              <Button type="button" onClick={handleNextStep} className="w-full mt-4">
                Next: Ticket Tiers →
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ticket Tiers & Event Banner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <TicketTierForm
                tiers={ticketTiers}
                onChange={(tiers: TicketTierInputData[]) =>
                  setValue('ticket_tiers', tiers, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  })
                }
                error={errors.ticket_tiers?.message}
              />

              <Controller
                name="banner"
                control={control}
                render={({ field }) => (
                  <FileDropzone
                    label="Event Banner Image"
                    accept="image/*"
                    file={field.value || null}
                    onChange={field.onChange}
                    helperText="Recommended aspect ratio 16:9 (1200x675px)"
                  />
                )}
              />

              <FormField as="textarea" rows={3} label="Terms & Conditions (Optional)" placeholder="Refund policy, age restrictions, etc." {...register('terms_and_conditions')} />

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  ← Back
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  isLoading={createEventMutation.isPending && !submitEventMutation.isPending}
                  onClick={handleSubmit(onSaveDraft, onFormInvalid)}
                  className="flex-1"
                >
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  isLoading={createEventMutation.isPending || submitEventMutation.isPending}
                  onClick={handleSubmit(onSubmitForReview, onFormInvalid)}
                  className="flex-1"
                >
                  Submit for Review
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
};
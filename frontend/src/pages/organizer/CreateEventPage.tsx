import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { createEventSchema, CreateEventFormData, TicketTierInputData } from '../../schemas/event.schema';
import { useCreateEvent, usePublicCategories } from '../../hooks/useEvents';
import { FormField } from '../../components/forms/FormField';
import { TicketTierForm } from '../../components/forms/TicketTierForm';
import { FileDropzone } from '../../components/forms/FileDropzone';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const createEventMutation = useCreateEvent();
  const { data: categories = [] } = usePublicCategories();

  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
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

  const ticketTiers = watch('ticket_tiers');

  const categoryOptions = [
    { value: '', label: 'Select a category' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const visibilityOptions = [
    { value: 'PUBLIC', label: 'Public (Listed on homepage)' },
    { value: 'UNLISTED', label: 'Unlisted (Link access only)' },
  ];

  const onSubmit = (data: CreateEventFormData) => {
    createEventMutation.mutate(data, {
      onSuccess: () => {
        navigate('/organizer/events');
      },
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Create New Event</h1>
        <p className="text-xs text-slate-500">Fill in event details, add ticket tiers, and save as draft</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-bold">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`pb-1 ${step === 1 ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}
        >
          1. Basic Details & Venue
        </button>
        <button
          type="button"
          onClick={() => setStep(2)}
          className={`pb-1 ${step === 2 ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}
        >
          2. Ticket Tiers & Banner
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                <FormField label="Start Date & Time" type="datetime-local" {...register('start_datetime')} error={errors.start_datetime?.message} />
                <FormField label="End Date & Time" type="datetime-local" {...register('end_datetime')} error={errors.end_datetime?.message} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <FormField label="Venue Name" placeholder="Pragya Bhawan" {...register('venue')} error={errors.venue?.message} />
                <FormField label="Street Address" placeholder="Kamaladi" {...register('address')} error={errors.address?.message} />
                <FormField label="City" placeholder="Kathmandu" {...register('city')} error={errors.city?.message} />
              </div>

              <Button type="button" onClick={() => setStep(2)} className="w-full mt-4">
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
                onChange={(tiers: TicketTierInputData[]) => setValue('ticket_tiers', tiers)}
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
                <Button type="submit" isLoading={createEventMutation.isPending} className="flex-1">
                  Save Event as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
};

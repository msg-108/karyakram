import React, { useState } from 'react';
import { usePendingOrganizers, useApproveOrRejectOrganizer } from '../../hooks/useAdmin';
import { DataTable, Column } from '../../components/dashboard/DataTable';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/forms/FormField';
import { OrganizerProfile } from '../../types/auth.types';
import { formatDateTime } from '../../lib/formatters';
import { FileText, CheckCircle2, XCircle } from 'lucide-react';

export const PendingOrganizersPage: React.FC = () => {
  const { data: organizers = [], isLoading } = usePendingOrganizers();
  const actionMutation = useApproveOrRejectOrganizer();

  const [selectedOrg, setSelectedOrg] = useState<OrganizerProfile | null>(null);
  const [reason, setReason] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleAction = (action: 'approve' | 'reject') => {
    if (!selectedOrg) return;

    actionMutation.mutate(
      {
        userId: selectedOrg.user.id,
        data: { action, reason },
      },
      {
        onSuccess: () => {
          setSelectedOrg(null);
          setReason('');
        },
      }
    );
  };

  const columns: Column<OrganizerProfile>[] = [
    {
      header: 'Organization',
      accessor: (row) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900 block">{row.organization_name}</span>
          <span className="text-xs text-slate-400 block">{row.website_url || 'No website'}</span>
        </div>
      ),
    },
    { header: 'Applicant', accessor: (row) => `${row.user.first_name} ${row.user.last_name}` },
    { header: 'Email', accessor: (row) => row.user.email },
    { header: 'Bank Name', accessor: (row) => row.bank_name },
    { header: 'Requested At', accessor: (row) => formatDateTime(row.approval_requested_at) },
    {
      header: 'Review',
      accessor: (row) => (
        <Button size="sm" variant="outline" onClick={() => setSelectedOrg(row)}>
          Inspect Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Pending Organizers</h1>
        <p className="text-xs text-slate-500">Inspect citizenship & PAN legal documents to approve organizer accounts</p>
      </div>

      <DataTable
        columns={columns}
        data={organizers}
        keyExtractor={(row) => row.id}
        emptyText="No organizer accounts waiting for approval."
      />

      {/* Detail & Action Modal */}
      {selectedOrg && (
        <Modal isOpen={Boolean(selectedOrg)} onClose={() => setSelectedOrg(null)} title="Inspect Organizer Application">
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <p className="font-bold text-slate-900 text-sm">{selectedOrg.organization_name}</p>
              <p className="text-slate-600">{selectedOrg.organization_description || 'No description provided.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-700">
              <div>
                <span className="text-slate-400 block font-medium">Applicant Name</span>
                <span className="font-semibold">{selectedOrg.user.first_name} {selectedOrg.user.last_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Bank Name</span>
                <span className="font-semibold">{selectedOrg.bank_name}</span>
              </div>
            </div>

            {/* Document links */}
            <div className="p-3 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-slate-800 block">Submitted Legal Documents</span>
              <div className="flex gap-4">
                {selectedOrg.citizenship_document ? (
                  <a href={selectedOrg.citizenship_document} target="_blank" rel="noreferrer" className="text-indigo-600 font-semibold underline flex items-center gap-1">
                    <FileText className="w-4 h-4" /> Citizenship Certificate
                  </a>
                ) : (
                  <span className="text-slate-400">No Citizenship File</span>
                )}

                {selectedOrg.pan_document ? (
                  <a href={selectedOrg.pan_document} target="_blank" rel="noreferrer" className="text-indigo-600 font-semibold underline flex items-center gap-1">
                    <FileText className="w-4 h-4" /> PAN Card
                  </a>
                ) : (
                  <span className="text-slate-400">No PAN File</span>
                )}
              </div>
            </div>

            <FormField
              as="textarea"
              rows={2}
              label="Rejection Reason (Required if rejecting)"
              placeholder="e.g. Citizenship image unclear or illegible"
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
            />

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="danger"
                className="flex-1 gap-1"
                isLoading={actionMutation.isPending}
                onClick={() => handleAction('reject')}
              >
                <XCircle className="w-4 h-4" />
                Reject Application
              </Button>

              <Button
                className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700"
                isLoading={actionMutation.isPending}
                onClick={() => handleAction('approve')}
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve Organizer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

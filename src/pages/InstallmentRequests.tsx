import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Search, RefreshCw, FileText, Eye } from 'lucide-react';
import { customerFinancing, type InstallmentRequest } from '../api';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

interface Props { lang: 'en' | 'ar' }
type ReviewMode = 'approve' | 'reject';

const t = {
  en: {
    title: 'Installment Requests', subtitle: 'Review and process customer installment applications',
    search: 'Search by customer name...', status: 'Status', date: 'Date', customer: 'Customer',
    motorcycle: 'Motorcycle', downPayment: 'Down Payment', amount: 'Installment Amount',
    duration: 'Duration (months)', actions: 'Actions', all: 'All Statuses', pending: 'Pending',
    approved: 'Approved', rejected: 'Rejected', approve: 'Approve', reject: 'Reject',
    rejectionReason: 'Rejection Reason (optional)', submit: 'Submit', cancel: 'Cancel',
    noData: 'No installment requests found.', loading: 'Loading...', error: 'Failed to load requests.',
    viewDetails: 'View Details', retry: 'Retry',
    confirmApprove: 'Are you sure you want to approve this installment request?',
    confirmReject: 'Are you sure you want to reject this installment request?',
  },
  ar: {
    title: 'طلبات التقسيط', subtitle: 'مراجعة ومعالجة طلبات تقسيط العملاء',
    search: 'بحث باسم العميل...', status: 'الحالة', date: 'التاريخ', customer: 'العميل',
    motorcycle: 'الدراجة', downPayment: 'الدفعة الأولى', amount: 'مبلغ القسط',
    duration: 'المدة (أشهر)', actions: 'الإجراءات', all: 'كل الحالات', pending: 'قيد المراجعة',
    approved: 'مقبول', rejected: 'مرفوض', approve: 'قبول', reject: 'رفض',
    rejectionReason: 'سبب الرفض (اختياري)', submit: 'تأكيد', cancel: 'إلغاء',
    noData: 'لا توجد طلبات تقسيط.', loading: 'جاري التحميل...', error: 'فشل تحميل الطلبات.',
    viewDetails: 'عرض التفاصيل', retry: 'إعادة المحاولة',
    confirmApprove: 'هل أنت متأكد من قبول طلب التقسيط؟',
    confirmReject: 'هل أنت متأكد من رفض طلب التقسيط؟',
  },
};

export default function InstallmentRequests({ lang }: Props) {
  const i18n = t[lang];
  const isRtl = lang === 'ar';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<InstallmentRequest | null>(null);
  const [modalMode, setModalMode] = useState<ReviewMode | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['installment-requests', statusFilter],
    queryFn: () => customerFinancing.listRequests(statusFilter || undefined),
  });

  function closeModal() {
    setModalMode(null);
    setSelected(null);
    setFormError(null);
  }

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: 'approved' | 'rejected'; reason?: string }) =>
      customerFinancing.reviewRequest(id, { status, rejectionReason: reason }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['installment-requests'] });
      closeModal();
    },
    onError: (error: Error) => setFormError(error.message),
  });

  function openReview(request: InstallmentRequest, mode: ReviewMode) {
    setSelected(request);
    setModalMode(mode);
    setRejectionReason('');
    setFormError(null);
  }

  function confirmReview() {
    if (!selected || !modalMode) return;
    setFormError(null);
    reviewMutation.mutate({
      id: selected.id,
      status: modalMode === 'approve' ? 'approved' : 'rejected',
      reason: rejectionReason || undefined,
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    confirmReview();
  }

  const rows = (query.data ?? []).filter(request => {
    if (!search) return true;
    const term = search.toLowerCase();
    const customerName = (request.customer?.name || request.buyerName || '').toLowerCase();
    const motorcycleName = request.motorcycle?.model.toLowerCase() ?? '';
    return customerName.includes(term) || motorcycleName.includes(term);
  });

  return <div className="page-container" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1>{i18n.title}</h1>
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>{i18n.subtitle}</p>
      </div>
    </div>

    <div className="card mb-4" style={{ padding: '0.75rem 1rem' }}>
      <div className="flex items-center gap-2">
        <Search size={16} style={{ color: 'var(--text-muted)' }} />
        <input
          className="input-field"
          style={{ flex: 1, border: 'none', background: 'transparent', padding: '0.25rem 0' }}
          placeholder={i18n.search}
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
        <select className="input-field" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
          <option value="">{i18n.all}</option>
          <option value="pending">{i18n.pending}</option>
          <option value="approved">{i18n.approved}</option>
          <option value="rejected">{i18n.rejected}</option>
        </select>
        <button onClick={() => void query.refetch()} className="btn btn-outline" style={{ padding: '0.375rem' }} title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>
    </div>

    <div className="table-container">
      {query.isLoading ? <div className="center-content"><div className="spinner" /><span>{i18n.loading}</span></div>
        : query.isError ? <div className="center-content" style={{ color: 'var(--error)' }}>
          <span>{i18n.error}</span>
          <button className="btn btn-outline mt-4" onClick={() => void query.refetch()}>{i18n.retry}</button>
        </div>
          : rows.length === 0 ? <div className="center-content">
            <FileText size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <span>{i18n.noData}</span>
          </div>
            : <table>
              <thead><tr>
                <th>{i18n.date}</th><th>{i18n.customer}</th><th>{i18n.motorcycle}</th>
                <th>{i18n.downPayment}</th><th>{i18n.amount}</th><th>{i18n.duration}</th>
                <th>{i18n.status}</th><th>{i18n.actions}</th>
              </tr></thead>
              <tbody>{rows.map(request => (
                <tr key={request.id} onClick={() => navigate(`/installment-requests/${request.id}`)} style={{ cursor: 'pointer' }}>
                  <td>{new Date(request.createdAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}</td>
                  <td>{request.customer?.name || request.buyerName || '—'}</td>
                  <td>{request.motorcycle?.model ?? '—'}</td>
                  <td>{request.downPayment != null ? request.downPayment.toLocaleString() : '—'}</td>
                  <td>{request.monthlyInstallment != null ? request.monthlyInstallment.toLocaleString() : '—'}</td>
                  <td>{request.durationMonths ?? '—'}</td>
                  <td><Badge
                    status={request.status === 'pending' ? 'inactive' : request.status === 'approved' ? 'active' : 'failed'}
                    label={request.status === 'pending' ? i18n.pending : request.status === 'approved' ? i18n.approved : i18n.rejected}
                    lang={lang}
                  /></td>
                  <td><div className="flex gap-2">
                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.375rem 0.625rem' }}
                      onClick={event => { event.stopPropagation(); navigate(`/installment-requests/${request.id}`); }}
                      title={i18n.viewDetails}
                    ><Eye size={14} /></button>
                    {request.status === 'pending' && <>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.375rem 0.625rem', borderColor: 'var(--success)', color: 'var(--success)' }}
                        onClick={event => { event.stopPropagation(); openReview(request, 'approve'); }}
                        title={i18n.approve}
                      ><CheckCircle size={14} /></button>
                      <button
                        className="btn"
                        style={{ padding: '0.375rem 0.625rem', background: 'var(--error-bg)', color: 'var(--error)' }}
                        onClick={event => { event.stopPropagation(); openReview(request, 'reject'); }}
                        title={i18n.reject}
                      ><XCircle size={14} /></button>
                    </>}
                  </div></td>
                </tr>
              ))}</tbody>
            </table>}
    </div>

    {modalMode && selected && <Modal
      title={modalMode === 'approve' ? i18n.approve : i18n.reject}
      onClose={closeModal}
      footer={<>
        <button className="btn btn-outline" onClick={closeModal} disabled={reviewMutation.isPending}>{i18n.cancel}</button>
        <button
          className="btn"
          style={{ background: modalMode === 'approve' ? 'var(--success)' : 'var(--error)', color: 'white' }}
          onClick={confirmReview}
          disabled={reviewMutation.isPending}
        >
          {reviewMutation.isPending && <span className="spinner" style={{ width: 16, height: 16 }} />}
          {i18n.submit}
        </button>
      </>}
    >
      <form onSubmit={submit}>
        {formError && <div className="login-error" style={{ marginBottom: '1rem' }} role="alert">{formError}</div>}
        <p style={{ marginBottom: '1rem' }}>{modalMode === 'approve' ? i18n.confirmApprove : i18n.confirmReject}</p>
        {modalMode === 'reject' && <div className="input-group">
          <label className="input-label">{i18n.rejectionReason}</label>
          <textarea className="input-field" rows={3} value={rejectionReason} onChange={event => setRejectionReason(event.target.value)} />
        </div>}
      </form>
    </Modal>}
  </div>;
}

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Settings2, ToggleLeft } from 'lucide-react';
import { auth, offerSettings, type OfferSettingsUpdate } from '../api';

interface Props { lang: 'en' | 'ar'; }

export default function OfferSettings({ lang }: Props) {
  const isRtl = lang === 'ar';
  const queryClient = useQueryClient();
  const labels = isRtl ? {
    title: 'إعدادات العروض والتقسيط',
    description: 'إدارة عرض الصفحة الرئيسية، نسبة الخصم، قيمة المقدم، ومدّة التقسيط.',
    enabled: 'تفعيل العرض',
    enabledStatus: 'العرض مفعّل',
    disabledStatus: 'العرض متوقف',
    discountPercentage: 'نسبة الخصم (%)',
    downPaymentAmount: 'قيمة المقدم (جنيه)',
    installmentDurationMonths: 'مدة التقسيط (شهر)',
    save: 'حفظ الإعدادات',
    saving: 'جارٍ الحفظ...',
    retry: 'إعادة المحاولة',
    success: 'تم حفظ إعدادات العرض بنجاح.',
    errorLoad: 'تعذر تحميل إعدادات العرض.',
    errorSave: 'تعذر حفظ إعدادات العرض. حاول مرة أخرى.',
    invalidDiscount: 'نسبة الخصم يجب أن تكون بين 0 و 100.',
    invalidDownPayment: 'قيمة المقدم يجب أن تكون 0 أو أكثر.',
    invalidMonths: 'مدة التقسيط يجب أن تكون بين 1 و 120 شهر.',
    helper: 'يمكن تعطيل العرض في أي وقت دون تغيير البيانات التاريخية.',
    downPaymentHelper: 'اترك الحقل فارغاً إذا لم يتم تحديد المقدم؛ لن يظهر العرض للعملاء حتى يتم ضبطه.',
    noPermission: 'ليس لديك صلاحية تعديل إعدادات العروض.',
  } : {
    title: 'Homepage Promotion Settings',
    description: 'Manage the homepage offer, discount rate, down payment amount, and installment duration.',
    enabled: 'Enable offer',
    enabledStatus: 'Offer is enabled',
    disabledStatus: 'Offer is disabled',
    discountPercentage: 'Discount percentage (%)',
    downPaymentAmount: 'Down payment (EGP)',
    installmentDurationMonths: 'Installment duration (months)',
    save: 'Save settings',
    saving: 'Saving...',
    retry: 'Retry',
    success: 'Offer settings saved successfully.',
    errorLoad: 'Unable to load offer settings.',
    errorSave: 'Unable to save offer settings. Please try again.',
    invalidDiscount: 'Discount percentage must be between 0 and 100.',
    invalidDownPayment: 'Down payment must be 0 or greater.',
    invalidMonths: 'Installment duration must be between 1 and 120 months.',
    helper: 'You can disable the offer at any time without altering historical sales data.',
    downPaymentHelper: 'Leave blank if the down payment is not configured; the offer will stay hidden until it is set.',
    noPermission: 'You do not have permission to change offer settings.',
  };

  const settingsQuery = useQuery({
    queryKey: ['admin-offer-settings'],
    queryFn: offerSettings.get,
  });
  const userQuery = useQuery({
    queryKey: ['current-user'],
    queryFn: auth.currentUser,
  });

  const [form, setForm] = useState({
    enabled: false,
    discountPercentage: '30',
    downPaymentAmount: '',
    installmentDurationMonths: '24',
  });
  const [validationError, setValidationError] = useState('');
  const [saved, setSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const settings = settingsQuery.data;
    if (!settings) return;

    setForm({
      enabled: Boolean(settings.enabled),
      discountPercentage: Number.isFinite(Number(settings.discountPercentage)) ? String(Number(settings.discountPercentage)) : '30',
      downPaymentAmount: settings.downPaymentAmount == null ? '' : String(settings.downPaymentAmount),
      installmentDurationMonths: Number.isFinite(Number(settings.installmentDurationMonths)) ? String(Number(settings.installmentDurationMonths)) : '24',
    });
    setInitialized(true);
  }, [settingsQuery.data]);

  const mutation = useMutation({
    mutationFn: (payload: OfferSettingsUpdate) => offerSettings.update(payload),
    onSuccess: async (data) => {
      setForm({
        enabled: data.enabled,
        discountPercentage: String(data.discountPercentage),
        downPaymentAmount: data.downPaymentAmount == null ? '' : String(data.downPaymentAmount),
        installmentDurationMonths: String(data.installmentDurationMonths),
      });
      setSaved(true);
      setValidationError('');
      await queryClient.invalidateQueries({ queryKey: ['admin-offer-settings'] });
    },
    onError: () => {
      setSaved(false);
      setValidationError(labels.errorSave);
    },
  });

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.discountPercentage.trim() === '') {
      setSaved(false);
      setValidationError(labels.invalidDiscount);
      return;
    }

    const discountPercentage = Number(form.discountPercentage);
    const downPaymentAmount = form.downPaymentAmount.trim() === '' ? null : Number(form.downPaymentAmount);
    const installmentDurationMonths = Number(form.installmentDurationMonths);

    if (!Number.isFinite(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
      setSaved(false);
      setValidationError(labels.invalidDiscount);
      return;
    }

    if (downPaymentAmount !== null && (!Number.isFinite(downPaymentAmount) || downPaymentAmount < 0)) {
      setSaved(false);
      setValidationError(labels.invalidDownPayment);
      return;
    }

    if (!Number.isFinite(installmentDurationMonths) || installmentDurationMonths < 1 || installmentDurationMonths > 120) {
      setSaved(false);
      setValidationError(labels.invalidMonths);
      return;
    }

    setSaved(false);
    setValidationError('');
    mutation.mutate({
      enabled: form.enabled,
      discountPercentage,
      downPaymentAmount,
      installmentDurationMonths,
    });
  };

  if (settingsQuery.isLoading || userQuery.isLoading || !initialized) {
    return <div className="page-container" style={{ direction: isRtl ? 'rtl' : 'ltr' }}><div className="card center-content"><div className="spinner" /></div></div>;
  }

  if (settingsQuery.isError || userQuery.isError) {
    return <div className="page-container" style={{ direction: isRtl ? 'rtl' : 'ltr' }}><div className="card" style={{ color: 'var(--error)' }}><p>{labels.errorLoad}</p><button className="btn btn-outline mt-4" onClick={() => settingsQuery.refetch()}>{labels.retry}</button></div></div>;
  }

  const canUpdateSettings = userQuery.data?.role.name === 'super_admin'
    || userQuery.data?.role.permissions.some(
      permission => permission.resource === 'setting' && permission.action === 'update',
    ) === true;

  if (!canUpdateSettings) {
    return <div className="page-container" style={{ direction: isRtl ? 'rtl' : 'ltr' }}><div className="card" style={{ color: 'var(--error)' }} role="alert">{labels.noPermission}</div></div>;
  }

  return (
    <div className="page-container" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      <div className="flex items-center gap-3 mb-6">
        <Settings2 size={24} style={{ color: 'var(--accent-primary)' }} />
        <div>
          <h1>{labels.title}</h1>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>{labels.description}</p>
        </div>
      </div>

      <form className="card" onSubmit={submit} style={{ maxWidth: 720 }}>
        <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-bottom">
          <div>
            <p style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{labels.enabled}</p>
            <small className="text-muted">{form.enabled ? labels.enabledStatus : labels.disabledStatus}. {labels.helper}</small>
          </div>
          <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={event => setForm(current => ({ ...current, enabled: event.target.checked }))}
              aria-label={labels.enabled}
            />
            <ToggleLeft size={18} style={{ color: form.enabled ? 'var(--success)' : 'var(--text-muted)' }} />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="discountPercentage" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>{labels.discountPercentage}</label>
            <input
              id="discountPercentage"
              className="input"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={form.discountPercentage}
              onChange={event => setForm(current => ({ ...current, discountPercentage: event.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="downPaymentAmount" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>{labels.downPaymentAmount}</label>
            <input
              id="downPaymentAmount"
              className="input"
              type="number"
              min={0}
              step="0.01"
              value={form.downPaymentAmount}
              onChange={event => setForm(current => ({ ...current, downPaymentAmount: event.target.value }))}
            />
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{labels.downPaymentHelper}</p>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="installmentDurationMonths" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>{labels.installmentDurationMonths}</label>
            <input
              id="installmentDurationMonths"
              className="input"
              type="number"
              min={1}
              max={120}
              step={1}
              value={form.installmentDurationMonths}
              onChange={event => setForm(current => ({ ...current, installmentDurationMonths: event.target.value }))}
            />
          </div>
        </div>

        {validationError && <p role="alert" style={{ color: 'var(--error)', marginTop: '1rem' }}>{validationError}</p>}
        {saved && <p role="status" style={{ color: 'var(--success)', marginTop: '1rem' }}>{labels.success}</p>}

        <button type="submit" className="btn btn-primary mt-4" disabled={mutation.isPending}>
          <Save size={16} />
          {mutation.isPending ? labels.saving : labels.save}
        </button>
      </form>
    </div>
  );
}

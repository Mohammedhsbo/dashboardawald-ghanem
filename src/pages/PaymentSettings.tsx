import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Settings } from 'lucide-react';
import { paymentSettings } from '../api';

interface Props {
  lang: 'en' | 'ar';
}

export default function PaymentSettings({ lang }: Props) {
  const isRtl = lang === 'ar';
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ['payment-settings'],
    queryFn: paymentSettings.get,
  });
  const [account, setAccount] = useState('');
  const [validationError, setValidationError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settingsQuery.data) setAccount(settingsQuery.data.instaPayAccount ?? '');
  }, [settingsQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (value: string | null) => paymentSettings.update(value),
    onSuccess: async (data) => {
      setAccount(data.instaPayAccount ?? '');
      setSaved(true);
      setValidationError('');
      await queryClient.invalidateQueries({ queryKey: ['payment-settings'] });
    },
    onError: () => {
      setSaved(false);
      setValidationError(isRtl ? 'تعذر حفظ إعداد الدفع. حاول مرة أخرى.' : 'Unable to save payment settings. Please try again.');
    },
  });

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedAccount = account.trim();
    if (normalizedAccount.length > 120 || /[\u0000-\u001f\u007f]/.test(normalizedAccount)) {
      setSaved(false);
      setValidationError(isRtl
        ? 'أدخل معرّف InstaPay صالحاً بحد أقصى 120 حرفاً.'
        : 'Enter a valid InstaPay identifier up to 120 characters.');
      return;
    }
    setSaved(false);
    setValidationError('');
    updateMutation.mutate(normalizedAccount || null);
  };

  return (
    <div className="page-container" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      <div className="flex items-center gap-3 mb-6">
        <Settings size={24} style={{ color: 'var(--accent-primary)' }} />
        <div>
          <h1>{isRtl ? 'إعدادات الدفع' : 'Payment Settings'}</h1>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {isRtl ? 'إدارة معرّف InstaPay الذي يظهر للعملاء عند الدفع.' : 'Manage the InstaPay identifier shown to customers at checkout.'}
          </p>
        </div>
      </div>

      {settingsQuery.isLoading ? (
        <div className="card center-content"><div className="spinner" /></div>
      ) : settingsQuery.isError ? (
        <div className="card" style={{ color: 'var(--error)' }}>
          <p>{isRtl ? 'تعذر تحميل إعداد الدفع.' : 'Unable to load payment settings.'}</p>
          <button className="btn btn-outline mt-4" onClick={() => settingsQuery.refetch()}>
            {isRtl ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      ) : (
        <form className="card" onSubmit={submit} style={{ maxWidth: 680 }}>
          <label htmlFor="instaPayAccount" style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            {isRtl ? 'رقم أو معرّف InstaPay' : 'InstaPay number or identifier'}
          </label>
          <input
            id="instaPayAccount"
            className="input"
            value={account}
            onChange={(event) => {
              setAccount(event.target.value);
              setSaved(false);
              setValidationError('');
            }}
            maxLength={120}
            autoComplete="off"
            dir="auto"
            aria-invalid={Boolean(validationError)}
          />
          <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {isRtl
              ? 'يمكن إدخال رقم هاتف أو معرّف InstaPay؛ لا يُشترط أن يكون رقم هاتف. ترك الحقل فارغاً يعطّل الدفع عبر InstaPay.'
              : 'Use a phone number or an InstaPay alias; it does not have to be a phone number. Leaving it blank disables InstaPay.'}
          </p>

          {validationError && <p role="alert" style={{ color: 'var(--error)', marginTop: '1rem' }}>{validationError}</p>}
          {saved && <p role="status" style={{ color: 'var(--success)', marginTop: '1rem' }}>{isRtl ? 'تم حفظ إعداد الدفع.' : 'Payment settings saved.'}</p>}

          <button
            type="submit"
            className="btn btn-primary mt-4"
            disabled={updateMutation.isPending}
          >
            <Save size={16} />
            {updateMutation.isPending
              ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...')
              : (isRtl ? 'حفظ الإعدادات' : 'Save settings')}
          </button>
        </form>
      )}
    </div>
  );
}

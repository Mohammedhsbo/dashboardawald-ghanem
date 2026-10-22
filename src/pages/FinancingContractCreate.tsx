import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import CustomerSearch from '../components/CustomerSearch';
import {
  customerFinancing,
  financingContracts,
  orders,
  type CreateFinancingContractInput,
  type InstallmentFrequency,
  type OrderListItem,
} from '../api';

interface Props { lang: 'en' | 'ar' }

const labels = {
  en: {
    title: 'Create Financing Plan',
    customerOrder: 'Customer and Order',
    selectCustomer: 'Select customer',
    searchOrders: 'Search customer orders',
    loadingOrders: 'Loading orders...',
    noOrders: 'No eligible confirmed or processing orders.',
    company: 'Financing company',
    selectCompany: 'Select a financing company',
    loadingCompanies: 'Loading financing companies...',
    companyError: 'Could not load financing companies.',
    retry: 'Retry',
    rate: 'Annual interest rate',
    planTerms: 'Plan Terms',
    motorcyclePrice: 'Motorcycle price',
    downPayment: 'Down payment',
    installments: 'Installments',
    frequency: 'Frequency',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    startDate: 'Start date',
    breakdown: 'Financial Summary',
    amountFinanced: 'Amount financed',
    interestAmount: 'Interest amount',
    totalPayable: 'Total amount payable',
    schedule: 'Schedule Preview',
    dueDate: 'Due date',
    amount: 'Amount',
    invalidSelection: 'Select a customer, order, and financing company.',
    invalidAmounts: 'Check the price and down payment amounts.',
    invalidCount: 'Installments must be a valid count and duration cannot exceed 120 months.',
    orderAmountMismatch: 'The price must match the selected order net amount.',
    create: 'Create Financing Plan',
    saving: 'Saving...',
    selectTerms: 'Enter valid plan terms to preview installments.',
    months: 'months',
  },
  ar: {
    title: 'إنشاء خطة تمويل',
    customerOrder: 'العميل والطلب',
    selectCustomer: 'اختر العميل',
    searchOrders: 'ابحث في طلبات العميل',
    loadingOrders: 'جاري تحميل الطلبات...',
    noOrders: 'لا توجد طلبات مؤكدة أو قيد التنفيذ.',
    company: 'شركة التمويل',
    selectCompany: 'اختر شركة التمويل',
    loadingCompanies: 'جاري تحميل شركات التمويل...',
    companyError: 'تعذر تحميل شركات التمويل.',
    retry: 'إعادة المحاولة',
    rate: 'نسبة الفائدة السنوية',
    planTerms: 'شروط الخطة',
    motorcyclePrice: 'سعر الدراجة',
    downPayment: 'الدفعة المقدمة',
    installments: 'عدد الأقساط',
    frequency: 'دورية السداد',
    monthly: 'شهري',
    quarterly: 'ربع سنوي',
    startDate: 'تاريخ البدء',
    breakdown: 'الملخص المالي',
    amountFinanced: 'المبلغ الممول',
    interestAmount: 'قيمة الفائدة',
    totalPayable: 'إجمالي المبلغ المستحق',
    schedule: 'معاينة جدول الأقساط',
    dueDate: 'تاريخ الاستحقاق',
    amount: 'المبلغ',
    invalidSelection: 'اختر العميل والطلب وشركة التمويل.',
    invalidAmounts: 'تحقق من السعر ومبلغ الدفعة المقدمة.',
    invalidCount: 'يجب أن يكون عدد الأقساط صحيحاً وألا تتجاوز المدة 120 شهراً.',
    orderAmountMismatch: 'يجب أن يطابق السعر صافي الطلب المحدد.',
    create: 'إنشاء خطة التمويل',
    saving: 'جاري الحفظ...',
    selectTerms: 'أدخل شروطاً صحيحة لمعاينة الأقساط.',
    months: 'شهر',
  },
};

function addFrequency(date: Date, frequency: InstallmentFrequency, count: number) {
  const targetMonth = date.getUTCMonth() + count * (frequency === 'quarterly' ? 3 : 1);
  const target = new Date(Date.UTC(date.getUTCFullYear(), targetMonth, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(date.getUTCDate(), lastDay)));
}

function roundMoney(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export default function FinancingContractCreate({ lang }: Props) {
  const isRtl = lang === 'ar';
  const text = labels[lang];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [customer, setCustomer] = useState<{ id: string; name: string; phone: string } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderListItem | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [financingCompanyId, setFinancingCompanyId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [count, setCount] = useState('12');
  const [frequency, setFrequency] = useState<InstallmentFrequency>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const companyQuery = useQuery({
    queryKey: ['financing-companies'],
    queryFn: () => customerFinancing.listCompanies(),
  });
  const selectedCompany = companyQuery.data?.find(company => company.id === financingCompanyId);
  const orderQuery = useQuery({
    queryKey: ['financing-create-orders', customer?.id, orderSearch],
    queryFn: () => orders.list({ customerId: customer!.id, search: orderSearch || undefined, limit: 50 }),
    enabled: !!customer,
  });
  const eligibleOrders = (orderQuery.data?.items ?? []).filter(order => order.status === 'confirmed' || order.status === 'processing');
  const installmentCount = Number(count);
  const total = Number(totalAmount);
  const down = Number(downPayment);
  const durationMonths = installmentCount * (frequency === 'quarterly' ? 3 : 1);
  const principal = roundMoney(total - down);
  const interest = selectedCompany && Number.isFinite(principal) && principal >= 0 && Number.isFinite(durationMonths)
    ? roundMoney(principal * selectedCompany.annualInterestRate * durationMonths / 1200)
    : 0;
  const scheduleBalance = roundMoney(principal + interest);
  const totalPayable = roundMoney(total + interest);

  const preview = useMemo(() => {
    if (!selectedCompany || !Number.isInteger(installmentCount) || installmentCount < 1 ||
      installmentCount > 120 || durationMonths > 120 || !Number.isFinite(scheduleBalance) ||
      scheduleBalance <= 0 || !startDate) return [];
    const base = roundMoney(scheduleBalance / installmentCount);
    const firstDate = new Date(`${startDate}T00:00:00.000Z`);
    return Array.from({ length: installmentCount }, (_, index) => ({
      number: index + 1,
      amount: index === installmentCount - 1
        ? roundMoney(scheduleBalance - base * (installmentCount - 1))
        : base,
      dueDate: addFrequency(firstDate, frequency, index),
    }));
  }, [durationMonths, frequency, installmentCount, scheduleBalance, selectedCompany, startDate]);

  const createMutation = useMutation({
    mutationFn: (data: CreateFinancingContractInput) => financingContracts.create(data),
    onSuccess: contract => {
      void queryClient.invalidateQueries({ queryKey: ['financing-contracts'] });
      navigate(`/financing/${contract.id}`);
    },
    onError: (reason: Error) => setError(reason.message),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!customer || !selectedOrder || !selectedCompany) return setError(text.invalidSelection);
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(down) || down < 0 || down >= total) {
      return setError(text.invalidAmounts);
    }
    const maxInstallments = frequency === 'quarterly' ? 40 : 120;
    if (!Number.isInteger(installmentCount) || installmentCount < 1 || installmentCount > maxInstallments) {
      return setError(text.invalidCount);
    }
    if (Math.abs(total - selectedOrder.netAmount) > 0.01) return setError(text.orderAmountMismatch);
    createMutation.mutate({
      orderId: selectedOrder.id,
      customerId: customer.id,
      financingCompanyId: selectedCompany.id,
      totalAmount: total,
      downPayment: down,
      numberOfInstallments: installmentCount,
      startDate,
      installmentFrequency: frequency,
    });
  }

  const money = (amount: number) =>
    amount.toLocaleString(isRtl ? 'ar-EG' : 'en-EG', { style: 'currency', currency: 'EGP' });

  return <div className="page-container" style={{ direction: isRtl ? 'rtl' : 'ltr', maxWidth: 900 }}>
    <div className="flex items-center gap-4 mb-6">
      <button className="btn btn-outline" onClick={() => navigate('/financing')} aria-label={isRtl ? 'العودة' : 'Back'}>
        <ArrowLeft size={18} />
      </button>
      <h1 style={{ margin: 0 }}>{text.title}</h1>
    </div>
    <form onSubmit={submit}>
      {error && <div className="login-error" style={{ marginBottom: '1rem' }} role="alert">{error}</div>}
      <div className="card mb-4">
        <h2 style={{ fontSize: '1rem' }}>{text.customerOrder}</h2>
        <div className="flex gap-2" style={{ alignItems: 'center', margin: '1rem 0' }}>
          <CustomerSearch lang={lang} onSelect={value => { setCustomer(value); setSelectedOrder(null); setTotalAmount(''); }} trigger={
            <button type="button" className="btn btn-outline">{customer?.name ?? text.selectCustomer}</button>
          } />
          {customer && <span className="text-muted">{customer.phone}</span>}
        </div>
        {customer && <>
          <input className="input" placeholder={text.searchOrders} value={orderSearch} onChange={event => setOrderSearch(event.target.value)} />
          {orderQuery.isLoading ? <p className="text-muted">{text.loadingOrders}</p>
            : orderQuery.isError ? <p className="text-muted" role="alert">{orderQuery.error.message}</p>
            : eligibleOrders.length === 0 ? <p className="text-muted">{text.noOrders}</p>
            : <div style={{ display: 'grid', gap: '.5rem', marginTop: '.75rem' }}>
              {eligibleOrders.map(order => <button
                type="button"
                key={order.id}
                className="btn"
                onClick={() => { setSelectedOrder(order); setTotalAmount(String(order.netAmount)); }}
                style={{ textAlign: isRtl ? 'right' : 'left', background: selectedOrder?.id === order.id ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: selectedOrder?.id === order.id ? 'white' : 'var(--text-primary)' }}
              ><strong>{order.orderNumber}</strong> · {order.status} · {money(order.netAmount)}</button>)}
            </div>}
        </>}
      </div>

      <div className="card mb-4">
        <h2 style={{ fontSize: '1rem' }}>{text.planTerms}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <label className="input-group">
            <span className="input-label">{text.company} *</span>
            <select className="input" value={financingCompanyId} required disabled={companyQuery.isLoading || companyQuery.isError} onChange={event => setFinancingCompanyId(event.target.value)}>
              <option value="">{companyQuery.isLoading ? text.loadingCompanies : text.selectCompany}</option>
              {(companyQuery.data ?? []).map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
          </label>
          <label className="input-group">
            <span className="input-label">{text.rate}</span>
            <input className="input" value={selectedCompany ? `${selectedCompany.annualInterestRate}%` : '—'} readOnly />
          </label>
          <label className="input-group">
            <span className="input-label">{text.motorcyclePrice}</span>
            <input className="input" type="number" min="0.01" step="0.01" value={totalAmount} onChange={event => setTotalAmount(event.target.value)} required />
          </label>
          <label className="input-group">
            <span className="input-label">{text.downPayment}</span>
            <input className="input" type="number" min="0" step="0.01" value={downPayment} onChange={event => setDownPayment(event.target.value)} required />
          </label>
          <label className="input-group">
            <span className="input-label">{text.installments}</span>
            <input className="input" type="number" min="1" max={frequency === 'quarterly' ? 40 : 120} value={count} onChange={event => setCount(event.target.value)} required />
          </label>
          <label className="input-group">
            <span className="input-label">{text.frequency}</span>
            <select className="input" value={frequency} onChange={event => setFrequency(event.target.value as InstallmentFrequency)}>
              <option value="monthly">{text.monthly}</option><option value="quarterly">{text.quarterly}</option>
            </select>
          </label>
          <label className="input-group">
            <span className="input-label">{text.startDate}</span>
            <input className="input" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} required />
          </label>
        </div>
        {companyQuery.isError && <div className="flex items-center gap-2 mt-4" role="alert">
          <span className="text-muted">{text.companyError}</span>
          <button type="button" className="btn btn-outline" onClick={() => void companyQuery.refetch()}>{text.retry}</button>
        </div>}
      </div>

      <div className="card mb-4">
        <h2 style={{ fontSize: '1rem' }}>{text.breakdown}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div><span className="text-muted">{text.amountFinanced}</span><strong style={{ display: 'block' }}>{money(principal)}</strong></div>
          <div><span className="text-muted">{text.interestAmount}</span><strong style={{ display: 'block' }}>{money(interest)}</strong></div>
          <div><span className="text-muted">{text.totalPayable}</span><strong style={{ display: 'block' }}>{money(totalPayable)}</strong></div>
          <div><span className="text-muted">{text.rate}</span><strong style={{ display: 'block' }}>{selectedCompany ? `${selectedCompany.annualInterestRate}% · ${durationMonths} ${text.months}` : '—'}</strong></div>
        </div>
      </div>

      <div className="card mb-4">
        <h2 style={{ fontSize: '1rem' }}>{text.schedule}</h2>
        {preview.length === 0 ? <p className="text-muted">{text.selectTerms}</p> : <div className="table-container">
          <table><thead><tr><th>#</th><th>{text.dueDate}</th><th>{text.amount}</th></tr></thead><tbody>
            {preview.map(item => <tr key={item.number}><td>{item.number}</td><td>{new Intl.DateTimeFormat(isRtl ? 'ar-EG' : 'en-EG', { timeZone: 'UTC' }).format(item.dueDate)}</td><td>{money(item.amount)}</td></tr>)}
          </tbody></table>
        </div>}
      </div>
      <button className="btn btn-primary" type="submit" disabled={createMutation.isPending || companyQuery.isLoading || companyQuery.isError}>
        <Plus size={16} />{createMutation.isPending ? text.saving : text.create}
      </button>
    </form>
  </div>;
}

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, MapPin, ShoppingBag, AlertCircle, Package, Image } from 'lucide-react';
import { orders, type DeliveryAddress, type OrderStatus } from '../api';
import Badge from '../components/Badge';
import OrderStatusButtons from '../components/OrderStatusButtons';
import Modal from '../components/Modal';

interface Props {
  lang: 'en' | 'ar';
}

const t = {
  en: {
    backToOrders: 'Back to Orders',
    loading: 'Loading order...',
    error: 'Failed to load order.',
    notFound: 'Order not found.',
    orderDetails: 'Order Details',
    orderNumber: 'Order Number',
    placedOn: 'Placed On',
    status: 'Status',
    customer: 'Customer',
    phone: 'Phone',
    email: 'Email',
    address: 'Delivery Address',
    payment: 'Payment',
    paymentMethod: 'Payment method',
    paymentStatus: 'Payment status',
    cash: 'Cash on delivery',
    instapay: 'InstaPay transfer',
    unpaid: 'Unpaid',
    pendingVerification: 'Awaiting verification',
    paid: 'Paid',
    unknown: 'Not specified',
    senderIdentifier: 'Sender account / wallet',
    senderName: 'Transfer sender name',
    proof: 'Transfer proof',
    openProof: 'Open transfer proof',
    proofError: 'Could not open transfer proof.',
    recipientName: 'Recipient',
    recipientPhone: 'Recipient phone',
    governorate: 'Governorate',
    city: 'City / area',
    street: 'Street',
    buildingNumber: 'Building',
    floor: 'Floor',
    apartment: 'Apartment',
    instructions: 'Delivery instructions',
    branch: 'Branch',
    createdBy: 'Created By',
    orderItems: 'Order Items',
    vin: 'VIN',
    model: 'Model',
    year: 'Year',
    color: 'Color',
    brand: 'Brand',
    currentStatus: 'Current Status',
    unitPrice: 'Unit Price',
    orderSummary: 'Order Summary',
    subtotal: 'Subtotal',
    discount: 'Discount',
    netAmount: 'Net Amount',
    notes: 'Notes',
    noNotes: 'No notes',
    statusHistory: 'Status History',
    changedBy: 'Changed By',
    reason: 'Reason',
    at: 'at',
    confirmTransition: 'Confirm Status Change',
    changeStatusTo: 'Change order status to',
    enterReason: 'Enter reason (optional)',
    cancel: 'Cancel',
    confirm: 'Confirm',
    cancelOrder: 'Cancel Order',
    confirmCancel: 'Confirm Order Cancellation',
    cancelWarning: 'Are you sure you want to cancel this order? This action cannot be undone.',
    enterCancelReason: 'Enter cancellation reason',
    yes: 'Yes, Cancel',
    no: 'No',
    transitionSuccess: 'Order status updated successfully',
    transitionError: 'Failed to update order status',
    cancelSuccess: 'Order cancelled successfully',
    cancelError: 'Failed to cancel order',
  },
  ar: {
    backToOrders: 'العودة إلى الطلبات',
    loading: 'جاري تحميل الطلب...',
    error: 'فشل تحميل الطلب.',
    notFound: 'الطلب غير موجود.',
    orderDetails: 'تفاصيل الطلب',
    orderNumber: 'رقم الطلب',
    placedOn: 'تم الطلب في',
    status: 'الحالة',
    customer: 'العميل',
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
    address: 'عنوان التسليم',
    payment: 'بيانات الدفع',
    paymentMethod: 'طريقة الدفع',
    paymentStatus: 'حالة الدفع',
    cash: 'الدفع عند الاستلام',
    instapay: 'تحويل InstaPay',
    unpaid: 'غير مدفوع',
    pendingVerification: 'بانتظار مراجعة التحويل',
    paid: 'مدفوع',
    unknown: 'غير محدد',
    senderIdentifier: 'رقم الحساب أو المحفظة المحوّل منها',
    senderName: 'اسم صاحب التحويل',
    proof: 'إثبات التحويل',
    openProof: 'فتح صورة إثبات التحويل',
    proofError: 'تعذر فتح صورة إثبات التحويل.',
    recipientName: 'المستلم',
    recipientPhone: 'هاتف المستلم',
    governorate: 'المحافظة',
    city: 'المدينة أو المنطقة',
    street: 'الشارع',
    buildingNumber: 'رقم المبنى',
    floor: 'الدور',
    apartment: 'الشقة',
    instructions: 'تعليمات التوصيل',
    branch: 'الفرع',
    createdBy: 'أنشأه',
    orderItems: 'عناصر الطلب',
    vin: 'رقم الهيكل',
    model: 'الموديل',
    year: 'السنة',
    color: 'اللون',
    brand: 'العلامة التجارية',
    currentStatus: 'الحالة الحالية',
    unitPrice: 'سعر الوحدة',
    orderSummary: 'ملخص الطلب',
    subtotal: 'المجموع الفرعي',
    discount: 'الخصم',
    netAmount: 'المبلغ الصافي',
    notes: 'ملاحظات',
    noNotes: 'لا توجد ملاحظات',
    statusHistory: 'سجل الحالة',
    changedBy: 'تم التغيير بواسطة',
    reason: 'السبب',
    at: 'في',
    confirmTransition: 'تأكيد تغيير الحالة',
    changeStatusTo: 'تغيير حالة الطلب إلى',
    enterReason: 'أدخل السبب (اختياري)',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    cancelOrder: 'إلغاء الطلب',
    confirmCancel: 'تأكيد إلغاء الطلب',
    cancelWarning: 'هل أنت متأكد من إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.',
    enterCancelReason: 'أدخل سبب الإلغاء',
    yes: 'نعم، إلغاء',
    no: 'لا',
    transitionSuccess: 'تم تحديث حالة الطلب بنجاح',
    transitionError: 'فشل تحديث حالة الطلب',
    cancelSuccess: 'تم إلغاء الطلب بنجاح',
    cancelError: 'فشل إلغاء الطلب',
  },
};

export default function OrderDetail({ lang }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const i18n = t[lang];
  const isRtl = lang === 'ar';

  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [reason, setReason] = useState('');
  const [paymentProofError, setPaymentProofError] = useState('');

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orders.get(id!),
    enabled: !!id,
  });

  const { data: history } = useQuery({
    queryKey: ['order-history', id],
    queryFn: () => orders.getHistory(id!),
    enabled: !!id,
  });

  const transitionMutation = useMutation({
    mutationFn: ({ status, reason }: { status: OrderStatus; reason?: string }) =>
      orders.changeStatus(id!, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['order-history', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowTransitionModal(false);
      setPendingStatus(null);
      setReason('');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => orders.cancel(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['order-history', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowCancelModal(false);
      setReason('');
    },
  });

  const handleStatusTransition = (newStatus: OrderStatus) => {
    if (newStatus === 'cancelled') {
      setShowCancelModal(true);
    } else {
      setPendingStatus(newStatus);
      setShowTransitionModal(true);
    }
  };

  const confirmTransition = () => {
    if (pendingStatus) {
      transitionMutation.mutate({ status: pendingStatus, reason: reason || undefined });
    }
  };

  const confirmCancel = () => {
    cancelMutation.mutate(reason || undefined);
  };

  const formatCurrency = (amount: number) => {
    return Number(amount).toLocaleString('en', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openPaymentProof = async () => {
    const preview = window.open('', '_blank');
    if (!preview) {
      setPaymentProofError(i18n.proofError);
      return;
    }
    preview.opener = null;
    setPaymentProofError('');
    try {
      const proof = await orders.getPaymentProof(id!);
      const url = URL.createObjectURL(proof);
      preview.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      preview.close();
      setPaymentProofError(i18n.proofError);
    }
  };

  const addressLabels: Record<keyof DeliveryAddress, string> = {
    recipientName: i18n.recipientName,
    recipientPhone: i18n.recipientPhone,
    governorate: i18n.governorate,
    city: i18n.city,
    street: i18n.street,
    buildingNumber: i18n.buildingNumber,
    floor: i18n.floor,
    apartment: i18n.apartment,
    instructions: i18n.instructions,
  };

  if (isLoading) {
    return (
      <div className="page-container" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
        <div className="center-content">
          <div className="spinner" />
          <span style={{ marginTop: '0.75rem' }}>{i18n.loading}</span>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="page-container" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
        <div className="center-content" style={{ color: 'var(--error)' }}>
          <AlertCircle size={40} style={{ marginBottom: '0.75rem' }} />
          <span>{i18n.error}</span>
          <Link to="/orders" className="btn btn-primary mt-4">
            <ArrowLeft size={16} />
            {i18n.backToOrders}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/orders" className="btn btn-outline">
          <ArrowLeft size={16} />
          {i18n.backToOrders}
        </Link>
      </div>

      {/* Order header card */}
      <div className="card mb-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
          <div>
            <h1
              style={{
                fontFamily: 'monospace',
                fontSize: '1.5rem',
                color: 'var(--accent-primary)',
                marginBottom: '0.5rem',
              }}
            >
              {order.orderNumber}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {i18n.placedOn} {formatDate(order.createdAt)}
            </p>
          </div>
          <Badge status={order.status as any} lang={lang} />
        </div>

        {/* Status transition buttons */}
        <OrderStatusButtons
          currentStatus={order.status}
          lang={lang}
          onTransition={handleStatusTransition}
          isLoading={transitionMutation.isPending || cancelMutation.isPending}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Customer info */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <User size={18} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{i18n.customer}</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{order.customer.name}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{i18n.phone}:</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{order.customer.phone}</span>
            </div>
            {order.customer.email && (
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{i18n.email}:</span>
                <span style={{ color: 'var(--text-primary)' }}>{order.customer.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Delivery address */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <MapPin size={18} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{i18n.address}</h2>
          </div>
          {order.deliveryAddress ? (
            <dl style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
              {(Object.keys(addressLabels) as Array<keyof DeliveryAddress>).map((field) => {
                const value = order.deliveryAddress?.[field];
                return value ? (
                  <div key={field} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 0.6fr) 1fr', gap: '0.5rem' }}>
                    <dt style={{ color: 'var(--text-muted)' }}>{addressLabels[field]}</dt>
                    <dd style={{ margin: 0, color: 'var(--text-secondary)' }}>{value}</dd>
                  </div>
                ) : null;
              })}
            </dl>
          ) : order.address ? (
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <div>{order.address}</div>
            </div>
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>—</p>
          )}
        </div>

        {/* Payment method, verification state, and private transfer proof */}
        <div className="card mb-6" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <ShoppingBag size={18} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{i18n.payment}</h2>
          </div>
          <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <dt style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i18n.paymentMethod}</dt>
              <dd style={{ margin: '0.25rem 0 0', color: 'var(--text-primary)' }}>
                {order.paymentMethod === 'instapay' ? i18n.instapay : order.paymentMethod === 'cash' ? i18n.cash : i18n.unknown}
              </dd>
            </div>
            <div>
              <dt style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i18n.paymentStatus}</dt>
              <dd style={{ margin: '0.25rem 0 0', color: 'var(--text-primary)' }}>
                {order.paymentStatus === 'pending_verification'
                  ? i18n.pendingVerification
                  : order.paymentStatus === 'unpaid'
                    ? i18n.unpaid
                    : order.paymentStatus === 'paid'
                      ? i18n.paid
                      : i18n.unknown}
              </dd>
            </div>
            {order.paymentMethod === 'instapay' && (
              <>
                {order.senderIdentifier && (
                  <div>
                    <dt style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i18n.senderIdentifier}</dt>
                    <dd dir="auto" style={{ margin: '0.25rem 0 0', color: 'var(--text-primary)' }}>{order.senderIdentifier}</dd>
                  </div>
                )}
                {order.senderName && (
                  <div>
                    <dt style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i18n.senderName}</dt>
                    <dd style={{ margin: '0.25rem 0 0', color: 'var(--text-primary)' }}>{order.senderName}</dd>
                  </div>
                )}
                <div>
                  <dt style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i18n.proof}</dt>
                  <dd style={{ margin: '0.25rem 0 0' }}>
                    {order.hasPaymentProof ? (
                      <button type="button" className="btn btn-outline" onClick={openPaymentProof}>
                        <Image size={16} />
                        {i18n.openProof}
                      </button>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </dd>
                  {paymentProofError && <p role="alert" style={{ color: 'var(--error)', marginTop: '0.5rem' }}>{paymentProofError}</p>}
                </div>
              </>
            )}
          </dl>
        </div>

        {/* Branch info */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Package size={18} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{i18n.branch}</h2>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {lang === 'ar' ? order.branch.nameAr : order.branch.nameEn}
          </div>
        </div>

        {/* Created by */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <User size={18} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{i18n.createdBy}</h2>
          </div>
         <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{order.user?.name || '—'}</div>
        </div>
      </div>

      {/* Order items */}
      <div className="card mb-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <ShoppingBag size={18} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>{i18n.orderItems}</h2>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{i18n.vin}</th>
                <th>{i18n.brand}</th>
                <th>{i18n.model}</th>
                <th>{i18n.year}</th>
                <th>{i18n.color}</th>
                <th>{i18n.currentStatus}</th>
                <th style={{ textAlign: 'right' }}>{i18n.unitPrice}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {item.motorcycle.vin}
                  </td>
                  <td>{lang === 'ar' ? item.motorcycle.brand.nameAr : item.motorcycle.brand.nameEn}</td>
                  <td style={{ fontWeight: 500 }}>{item.motorcycle.model}</td>
                  <td>{item.motorcycle.year}</td>
                  <td>{item.motorcycle.color || '—'}</td>
                  <td>
                    <Badge status={item.motorcycle.currentStatus as any} lang={lang} />
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem' }}>
        {/* Status history */}
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>{i18n.statusHistory}</h2>
          {history && history.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {history.map((entry, idx) => (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    paddingBottom: idx < history.length - 1 ? '1rem' : 0,
                    borderBottom: idx < history.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{ flex: '0 0 auto' }}>
                    <Badge status={entry.after.status as any} lang={lang} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {entry.user.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatDate(entry.createdAt)}
                    </div>
                    {entry.reason && (
                      <div
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--text-secondary)',
                          marginTop: '0.5rem',
                          fontStyle: 'italic',
                        }}
                      >
                        "{entry.reason}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>—</p>
          )}
        </div>

        {/* Order summary sidebar */}
        <div>
          <div className="card mb-4">
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>{i18n.orderSummary}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{i18n.subtotal}</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{i18n.discount}</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--error)' }}>
                    -{formatCurrency(order.discount)}
                  </span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border)',
                  fontWeight: 600,
                }}
              >
                <span>{i18n.netAmount}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '1.125rem', color: 'var(--accent-primary)' }}>
                  {formatCurrency(order.netAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="card">
              <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>{i18n.notes}</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {order.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Transition confirmation modal */}
      {showTransitionModal && pendingStatus && (
        <Modal
          title={i18n.confirmTransition}
          onClose={() => {
            setShowTransitionModal(false);
            setPendingStatus(null);
            setReason('');
          }}
          footer={
            <>
              <button
                onClick={() => {
                  setShowTransitionModal(false);
                  setPendingStatus(null);
                  setReason('');
                }}
                className="btn btn-outline"
              >
                {i18n.cancel}
              </button>
              <button
                onClick={confirmTransition}
                disabled={transitionMutation.isPending}
                className="btn btn-primary"
              >
                {i18n.confirm}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.875rem' }}>
              {i18n.changeStatusTo} <Badge status={pendingStatus as any} lang={lang} />
            </p>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  marginBottom: '0.5rem',
                  color: 'var(--text-secondary)',
                }}
              >
                {i18n.enterReason}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input"
                rows={3}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <Modal
          title={i18n.confirmCancel}
          onClose={() => {
            setShowCancelModal(false);
            setReason('');
          }}
          footer={
            <>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setReason('');
                }}
                className="btn btn-outline"
              >
                {i18n.no}
              </button>
              <button
                onClick={confirmCancel}
                disabled={cancelMutation.isPending}
                className="btn"
                style={{ background: 'var(--error)', color: 'white' }}
              >
                {i18n.yes}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{i18n.cancelWarning}</p>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  marginBottom: '0.5rem',
                  color: 'var(--text-secondary)',
                }}
              >
                {i18n.enterCancelReason}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input"
                rows={3}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Save, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  brands,
  categories,
  motorcycles,
  type BrandResponse,
  type CategoryFlatItem,
  type MotorcycleInput,
  type MotorcycleUpdate,
} from '../api';
import { useBranch } from '../contexts/BranchContext';
import ImageUpload from '../components/ImageUpload';

interface Props {
  lang: 'en' | 'ar';
}

type MotorcycleFormValues = Omit<MotorcycleInput, 'fuelType'> & {
  fuelType: MotorcycleInput['fuelType'] | '';
};

const emptyForm = (branchId: string): MotorcycleFormValues => ({
  vin: '',
  engineNumber: '',
  fuelType: '',
  model: '',
  year: new Date().getFullYear(),
  color: '',
  engineSize: '',
  descriptionAr: '',
  descriptionEn: '',
  price: 0,
  costPrice: 0,
  brandId: '',
  categoryId: '',
  branchId,
  images: [],
});

function normalizeImages(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed as string[] : [];
    } catch {
      return [];
    }
  }
  return [];
}

function buildUpdatePayload(
  form: MotorcycleFormValues,
  original: MotorcycleFormValues,
  images: string[],
): MotorcycleUpdate {
  const update: MotorcycleUpdate = {};
  if (form.fuelType && form.fuelType !== original.fuelType) update.fuelType = form.fuelType;
  if (form.model !== original.model) update.model = form.model;
  if (form.year !== original.year) update.year = form.year;
  if (form.color !== original.color) update.color = form.color;
  if (form.engineNumber !== original.engineNumber) update.engineNumber = form.engineNumber;
  if (form.engineSize !== original.engineSize) update.engineSize = form.engineSize;
  if (form.descriptionAr !== original.descriptionAr) update.descriptionAr = form.descriptionAr;
  if (form.descriptionEn !== original.descriptionEn) update.descriptionEn = form.descriptionEn;
  if (form.price !== original.price) update.price = form.price;
  if (form.costPrice !== original.costPrice) update.costPrice = form.costPrice;
  if (form.brandId !== original.brandId) update.brandId = form.brandId;
  if (form.categoryId !== original.categoryId) update.categoryId = form.categoryId;
  if (JSON.stringify(images) !== JSON.stringify(normalizeImages(original.images))) update.images = images;
  return update;
}

export default function MotorcycleForm({ lang }: Props) {
  const isRtl = lang === 'ar';
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { branchId } = useBranch();
  const editing = Boolean(id);
  const [form, setForm] = useState<MotorcycleFormValues>(() => emptyForm(branchId ?? ''));
  const [originalForm, setOriginalForm] = useState<MotorcycleFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detail = useQuery({
    queryKey: ['motorcycle', id],
    queryFn: () => motorcycles.getById(id!),
    enabled: editing,
  });
  const brandQuery = useQuery({ queryKey: ['brands'], queryFn: () => brands.list() });
  const categoryQuery = useQuery({
    queryKey: ['categories', 'flat'],
    queryFn: () => categories.list({ flat: true }),
  });

  useEffect(() => {
    if (!detail.data) return;

    const item = detail.data;
    const savedForm: MotorcycleFormValues = {
      vin: item.vin,
      engineNumber: item.engineNumber ?? '',
      fuelType: item.fuelType ?? '',
      model: item.model,
      year: item.year,
      color: item.color ?? '',
      engineSize: item.engineSize ?? '',
      descriptionAr: item.descriptionAr ?? '',
      descriptionEn: item.descriptionEn ?? '',
      price: item.price,
      costPrice: item.costPrice,
      brandId: item.brandId,
      categoryId: item.categoryId,
      branchId: item.branchId,
      images: normalizeImages(item.images),
    };
    setForm(savedForm);
    setOriginalForm(savedForm);
  }, [detail.data]);

  useEffect(() => {
    if (!editing && branchId) setForm(current => ({ ...current, branchId }));
  }, [branchId, editing]);

  const createMut = useMutation({
    mutationFn: (data: MotorcycleInput) => motorcycles.create(data),
    onSuccess: item => {
      qc.invalidateQueries({ queryKey: ['motorcycles'] });
      navigate(`/motorcycles/${item.id}/edit`);
    },
    onError: (e: Error) => setError(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (data: MotorcycleUpdate) => motorcycles.update(id!, data),
    onSuccess: item => {
      qc.invalidateQueries({ queryKey: ['motorcycles'] });
      qc.setQueryData(['motorcycle', id], item);
      navigate('/motorcycles');
    },
    onError: (e: Error) => setError(e.message),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!form.fuelType) {
      setError(isRtl ? 'يرجى اختيار نوع الوقود.' : 'Please select a fuel type.');
      return;
    }
    if (!form.vin.trim() || !form.model.trim() || !form.brandId || !form.categoryId || !form.branchId || form.price <= 0 || form.costPrice < 0) {
      setError(isRtl ? 'يرجى إكمال الحقول المطلوبة.' : 'Please complete the required fields.');
      return;
    }

    const images = normalizeImages(form.images);
    if (editing) {
      if (!originalForm) {
        setError(isRtl ? 'تعذر تحميل بيانات الدراجة.' : 'Motorcycle data has not finished loading.');
        return;
      }
      const update = buildUpdatePayload(form, originalForm, images);
      if (Object.keys(update).length === 0) {
        navigate('/motorcycles');
        return;
      }
      updateMut.mutate(update);
      return;
    }

    const fuelType = form.fuelType;
    createMut.mutate({ ...form, fuelType, images });
  }

  const labels = isRtl
    ? {
        title: editing ? 'تعديل دراجة' : 'إضافة دراجة',
        back: 'رجوع',
        save: 'حفظ',
        cancel: 'إلغاء',
        vin: 'رقم الماتور',
        engineNumber: 'رقم الشاسيه',
        fuelType: 'نوع الوقود',
        petrol: 'بنزين',
        electric: 'كهرباء',
        model: 'الموديل',
        year: 'السنة',
        color: 'اللون',
        engine: 'حجم المحرك',
        ar: 'الوصف بالعربية',
        en: 'الوصف بالإنجليزية',
        price: 'سعر البيع',
        cost: 'سعر التكلفة',
        brand: 'العلامة التجارية',
        category: 'الفئة',
        branch: 'الفرع',
        images: 'الصور',
      }
    : {
        title: editing ? 'Edit Motorcycle' : 'Add Motorcycle',
        back: 'Back',
        save: 'Save',
        cancel: 'Cancel',
        vin: 'VIN',
        engineNumber: 'Chassis and engine number',
        fuelType: 'Fuel type',
        petrol: 'Petrol',
        electric: 'Electric',
        model: 'Model',
        year: 'Year',
        color: 'Color',
        engine: 'Engine size',
        ar: 'Arabic description',
        en: 'English description',
        price: 'Selling price',
        cost: 'Cost price',
        brand: 'Brand',
        category: 'Category',
        branch: 'Branch',
        images: 'Images',
      };

  const categoryItems = (categoryQuery.data ?? []) as CategoryFlatItem[];
  const isBusy = createMut.isPending || updateMut.isPending;
  const imageList = normalizeImages(form.images);
  const field = (name: keyof MotorcycleFormValues, value: string | number) =>
    setForm(current => ({ ...current, [name]: value }));

  return (
    <div className="page-container" style={{ direction: isRtl ? 'rtl' : 'ltr', maxWidth: 900 }}>
      <div className="flex items-center gap-4 mb-6">
        <button className="btn btn-outline" onClick={() => navigate('/motorcycles')} title={labels.back}>
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ margin: 0 }}>{labels.title}</h1>
      </div>
      <form className="card" onSubmit={submit}>
        {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        <div className="input-group">
          <label className="input-label">{labels.vin} *</label>
          <input
            className="input-field"
            value={form.vin}
            onChange={e => setForm(current => ({ ...current, vin: e.target.value.toUpperCase() }))}
            readOnly={editing}
            required
          />
        </div>
        <div className="input-group">
          <label className="input-label">{labels.engineNumber}</label>
          <input
            className="input-field"
            value={form.engineNumber ?? ''}
            onChange={e => field('engineNumber', e.target.value)}
          />
        </div>
        <div className="input-group">
          <label className="input-label">{labels.fuelType} *</label>
          <select
            className="input-field"
            value={form.fuelType}
            onChange={e => field('fuelType', e.target.value)}
            required
          >
            <option value="">{labels.fuelType}</option>
            <option value="PETROL">{labels.petrol}</option>
            <option value="ELECTRIC">{labels.electric}</option>
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">{labels.model} *</label>
          <input className="input-field" value={form.model} onChange={e => field('model', e.target.value)} required />
        </div>
        <div className="flex gap-4">
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">{labels.year}</label>
            <input className="input-field" type="number" value={form.year} onChange={e => field('year', Number(e.target.value))} />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">{labels.color}</label>
            <input className="input-field" value={form.color} onChange={e => field('color', e.target.value)} />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">{labels.engine}</label>
            <input className="input-field" value={form.engineSize} onChange={e => field('engineSize', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">{labels.brand} *</label>
            <select className="input-field" value={form.brandId} onChange={e => field('brandId', e.target.value)}>
              <option value="">{labels.brand}</option>
              {(brandQuery.data ?? []).map((brand: BrandResponse) => (
                <option key={brand.id} value={brand.id}>{isRtl ? brand.nameAr : brand.nameEn}</option>
              ))}
            </select>
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">{labels.category} *</label>
            <select className="input-field" value={form.categoryId} onChange={e => field('categoryId', e.target.value)}>
              <option value="">{labels.category}</option>
              {categoryItems.map(item => (
                <option key={item.id} value={item.id}>{isRtl ? item.nameAr : item.nameEn}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">{labels.price} *</label>
            <input className="input-field" type="number" min="0" step="0.01" value={form.price} onChange={e => field('price', Number(e.target.value))} />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">{labels.cost} *</label>
            <input className="input-field" type="number" min="0" step="0.01" value={form.costPrice} onChange={e => field('costPrice', Number(e.target.value))} />
          </div>
        </div>
        <div className="input-group">
          <label className="input-label">{labels.ar}</label>
          <textarea className="input-field" rows={3} value={form.descriptionAr} onChange={e => field('descriptionAr', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">{labels.en}</label>
          <textarea className="input-field" rows={3} value={form.descriptionEn} onChange={e => field('descriptionEn', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">{labels.images}</label>
          <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
            {imageList.map((url, index) => (
              <div key={`${url}-${index}`} style={{ position: 'relative' }}>
                <img src={url} alt="" style={{ width: 110, height: 90, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }} />
                <button
                  type="button"
                  className="btn"
                  onClick={() => setForm(current => ({
                    ...current,
                    images: normalizeImages(current.images).filter((_, imageIndex) => imageIndex !== index),
                  }))}
                  style={{ position: 'absolute', top: 2, right: 2, padding: '0.2rem', background: 'var(--error)', color: 'white' }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            {imageList.length < 10 && (
              <ImageUpload
                lang={lang}
                onUploaded={url => setForm(current => ({ ...current, images: [...normalizeImages(current.images), url] }))}
              />
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" type="button" onClick={() => navigate('/motorcycles')} disabled={isBusy}>
            {labels.cancel}
          </button>
          <button className="btn btn-primary" type="submit" disabled={isBusy}>
            {isBusy ? <span className="spinner" style={{ width: 16, height: 16 }} /> : editing ? <Save size={16} /> : <Plus size={16} />}
            {labels.save}
          </button>
        </div>
      </form>
    </div>
  );
}

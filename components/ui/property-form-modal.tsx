'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '@/components/ui/modal';
import {
  Property,
  PropertyFormData,
  PROPERTY_LOCATIONS,
  PROPERTY_CATEGORIES,
  PROPERTY_STATUSES,
  PropertyLocation,
  PropertyCategory,
  PropertyStatus,
  PropertyType,
} from '@/types';
import {
  Loader2,
  AlertCircle,
  Lock,
  DollarSign,
  FileText,
  MapPin,
  Tag,
  CheckSquare,
  Image as ImageIcon,
  BookOpen,
  Map as MapIcon,
  UploadCloud,
  X,
  Phone,
  Users,
  Clock,
} from 'lucide-react';
import { clsx } from 'clsx';

interface PropertyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  property?: Property | null; // null = add mode, Property = edit mode
  userId: string;
  onSuccess: (property: Property, mode: 'add' | 'edit') => void;
}

const defaultForm: PropertyFormData = {
  title: '',
  description: '',
  price: '',
  location: 'Dekwaneh',
  property_type: 'Sale',
  category: 'Residential Apartment',
  status: 'Available',
  image_urls: [],
  image_files: [],
  google_maps_url: '',
  natoor_notes: '',
  phone_number: '',
  involved_brokers: false,
  rental_period: '',
};

function propertyToForm(p: Property): PropertyFormData {
  return {
    title: p.title,
    description: p.description ?? '',
    price: String(p.price),
    location: p.location,
    property_type: p.property_type,
    category: p.category,
    status: p.status,
    image_urls: p.image_urls || (p.image_url ? [p.image_url] : []),
    image_files: [],
    google_maps_url: p.google_maps_url ?? '',
    natoor_notes: p.natoor_notes ?? '',
    phone_number: p.phone_number ?? '',
    involved_brokers: p.involved_brokers ?? false,
    rental_period: p.rental_period ?? '',
  };
}

// ── Small field helpers ──────────────────────────────────────────────

interface FieldWrapProps {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}

function FieldWrap({ label, icon, required, children, hint }: FieldWrapProps) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium dark:text-zinc-300 text-zinc-600">
        {icon}
        {label}
        {required && <span className="text-brand-gold">*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-xs dark:text-zinc-600 text-zinc-400">{hint}</p>
      )}
    </div>
  );
}

const inputBase =
  'w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3.5 py-2.5 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-gold/60 focus:border-brand-gold transition-all duration-200 text-sm dark:bg-zinc-800/60 dark:border-zinc-700 dark:text-white dark:placeholder:text-zinc-600 cursor-text';

const selectBase =
  'w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3.5 py-2.5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-gold/60 focus:border-brand-gold transition-all duration-200 text-sm dark:bg-zinc-800/60 dark:border-zinc-700 dark:text-white cursor-pointer';

// ── Main Component ───────────────────────────────────────────────────

export default function PropertyFormModal({
  isOpen,
  onClose,
  property,
  userId,
  onSuccess,
}: PropertyFormModalProps) {
  const isEditMode = Boolean(property);
  const [form, setForm] = useState<PropertyFormData>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (property) {
      setForm(propertyToForm(property));
    } else {
      setForm(defaultForm);
    }
    setError(null);
  }, [property, isOpen]);

  const set = <K extends keyof PropertyFormData>(
    key: K,
    value: PropertyFormData[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleChange =
    (key: keyof PropertyFormData) =>
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      set(key, e.target.value as never);

  const validate = (): string | null => {
    if (!form.title.trim()) return 'Title is required.';
    const priceNum = parseFloat(form.price);
    if (!form.price || isNaN(priceNum) || priceNum <= 0)
      return 'A valid price greater than 0 is required.';
    if (form.image_urls.length + form.image_files.length > 10)
      return 'You can only attach up to 10 images per property.';
    if (form.property_type === 'Rent' && !form.rental_period)
      return 'Please specify if the rental is Monthly or Yearly.';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const uploadedUrls: string[] = [];

      // Handle Multiple Image Uploads
      if (form.image_files.length > 0) {
        const uploadPromises = form.image_files.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${userId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(filePath, file);

          if (uploadError) throw new Error('Image upload failed: ' + uploadError.message);

          const { data: publicUrlData } = supabase.storage
            .from('property-images')
            .getPublicUrl(filePath);

          return publicUrlData.publicUrl;
        });

        const urls = await Promise.all(uploadPromises);
        uploadedUrls.push(...urls);
      }

      const finalImageUrls = [...form.image_urls, ...uploadedUrls];

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        price: parseFloat(form.price),
        location: form.location as PropertyLocation,
        property_type: form.property_type as PropertyType,
        category: form.category as PropertyCategory,
        status: form.status as PropertyStatus,
        image_url: finalImageUrls[0] || null, // legacy fallback
        image_urls: finalImageUrls,
        google_maps_url: form.google_maps_url.trim() || null,
        natoor_notes: form.natoor_notes.trim() || null,
        phone_number: form.phone_number.trim() || null,
        involved_brokers: form.involved_brokers,
        rental_period: form.property_type === 'Rent' ? (form.rental_period as 'Monthly' | 'Yearly') : null,
      };

      if (isEditMode && property) {
        // ── UPDATE ──
        const { data, error: dbError } = await supabase
          .from('properties')
          .update(payload)
          .eq('id', property.id)
          .select()
          .single();

        if (dbError) throw dbError;
        onSuccess(data as Property, 'edit');
      } else {
        // ── INSERT ──
        const { data, error: dbError } = await supabase
          .from('properties')
          .insert({ ...payload, user_id: userId })
          .select()
          .single();

        if (dbError) throw dbError;
        onSuccess(data as Property, 'add');
      }

      onClose();
    } catch (err: any) {
      console.error("Property save error:", err);
      let msg = 'Failed to save property. Please try again.';
      if (err instanceof Error) {
        msg = err.message;
      } else if (err && typeof err === 'object' && err.message) {
        msg = err.message;
      } else if (typeof err === 'string') {
        msg = err;
      }
      setError(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Property' : 'Add New Property'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Row 1: Title */}
        <FieldWrap
          label="Property Title"
          icon={<FileText className="w-3.5 h-3.5 text-brand-gold" />}
          required
        >
          <input
            type="text"
            placeholder="e.g. Modern 3BR Apartment in Dekwaneh"
            value={form.title}
            onChange={handleChange('title')}
            className={inputBase}
            required
          />
        </FieldWrap>

        {/* Row 2: Price + Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldWrap
            label="Price (USD)"
            icon={<DollarSign className="w-3.5 h-3.5 text-brand-gold" />}
            required
          >
            <input
              type="number"
              min="1"
              step="any"
              placeholder="e.g. 250000"
              value={form.price}
              onChange={handleChange('price')}
              className={inputBase}
              required
            />
          </FieldWrap>

          <FieldWrap label="Listing Type" required>
            <div className="flex gap-3 h-[42px]">
              {(['Sale', 'Rent'] as PropertyType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('property_type', t)}
                  className={clsx(
                    'flex-1 rounded-lg text-sm font-semibold border transition-all duration-200',
                    form.property_type === t
                      ? 'bg-brand-gold border-brand-gold text-white shadow-md shadow-brand-gold/20'
                      : 'dark:bg-zinc-800/60 bg-zinc-50 dark:border-zinc-700 border-zinc-300 dark:text-zinc-400 text-zinc-600 hover:border-brand-gold/50'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </FieldWrap>
        </div>

        {/* Row 2.5: Rental Period (Only if Rent) */}
        {form.property_type === 'Rent' && (
          <FieldWrap label="Rental Period" icon={<Clock className="w-3.5 h-3.5 text-brand-gold" />} required>
            <div className="flex gap-3 h-[42px]">
              {(['Monthly', 'Yearly']).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('rental_period', t as 'Monthly' | 'Yearly')}
                  className={clsx(
                    'flex-1 rounded-lg text-sm font-semibold border transition-all duration-200',
                    form.rental_period === t
                      ? 'bg-brand-gold border-brand-gold text-white shadow-md shadow-brand-gold/20'
                      : 'dark:bg-zinc-800/60 bg-zinc-50 dark:border-zinc-700 border-zinc-300 dark:text-zinc-400 text-zinc-600 hover:border-brand-gold/50'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </FieldWrap>
        )}

        {/* Row 3: Location + Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldWrap
            label="Location"
            icon={<MapPin className="w-3.5 h-3.5 text-brand-gold" />}
            required
          >
            <select
              value={form.location}
              onChange={handleChange('location')}
              className={selectBase}
            >
              {PROPERTY_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </FieldWrap>

          <FieldWrap
            label="Category"
            icon={<Tag className="w-3.5 h-3.5 text-brand-gold" />}
            required
          >
            <select
              value={form.category}
              onChange={handleChange('category')}
              className={selectBase}
            >
              {PROPERTY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </FieldWrap>
        </div>

        {/* Row 4: Status */}
        <FieldWrap
          label="Status"
          icon={<CheckSquare className="w-3.5 h-3.5 text-brand-gold" />}
          required
        >
          <div className="flex flex-wrap gap-2">
            {PROPERTY_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set('status', s)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200',
                  form.status === s
                    ? s === 'Available'
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                      : s === 'Pending'
                      ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                      : 'bg-zinc-700 border-zinc-600 text-zinc-200'
                    : 'dark:bg-zinc-800/60 bg-zinc-50 dark:border-zinc-700 border-zinc-300 dark:text-zinc-500 text-zinc-500 hover:border-zinc-500'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </FieldWrap>

        {/* Row 5: Description */}
        <FieldWrap
          label="Description"
          icon={<BookOpen className="w-3.5 h-3.5 text-brand-gold" />}
        >
          <textarea
            rows={3}
            placeholder="Describe the property — size, features, condition…"
            value={form.description}
            onChange={handleChange('description')}
            className={`${inputBase} resize-none`}
          />
        </FieldWrap>

        {/* Row 6: Image Upload & Maps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldWrap
            label={`Property Images (${form.image_urls.length + form.image_files.length}/10)`}
            icon={<UploadCloud className="w-3.5 h-3.5 text-brand-gold" />}
            hint="Upload up to 10 images."
          >
            <div className="space-y-3">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (form.image_urls.length + form.image_files.length + files.length > 10) {
                    alert('You can only select up to 10 images total.');
                    return;
                  }
                  set('image_files', [...form.image_files, ...files]);
                }}
                className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-gold/10 file:text-brand-gold hover:file:bg-brand-gold/20"
              />
              
              {/* Preview Grid */}
              {(form.image_urls.length > 0 || form.image_files.length > 0) && (
                <div className="grid grid-cols-4 gap-2">
                  {form.image_urls.map((url, i) => (
                    <div key={`url-${i}`} className="group relative aspect-square rounded-md overflow-hidden bg-zinc-800 border border-zinc-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => set('image_urls', form.image_urls.filter((_, index) => index !== i))} 
                        className="absolute top-1 right-1 bg-black/60 p-1 rounded-full hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {form.image_files.map((file, i) => (
                    <div key={`file-${i}`} className="group relative aspect-square rounded-md overflow-hidden bg-zinc-800 border border-zinc-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => set('image_files', form.image_files.filter((_, index) => index !== i))} 
                        className="absolute top-1 right-1 bg-black/60 p-1 rounded-full hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FieldWrap>

          <FieldWrap
            label="Google Maps Embed / Link"
            icon={<MapIcon className="w-3.5 h-3.5 text-brand-gold" />}
            hint="Paste an Embed HTML snippet or a standard Google Maps link."
          >
            <input
              type="url"
              placeholder="https://maps.google.com/..."
              value={form.google_maps_url}
              onChange={handleChange('google_maps_url')}
              className={inputBase}
            />
          </FieldWrap>
        </div>

        {/* Row 7: Phone & Brokers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldWrap
            label="Phone Number"
            icon={<Phone className="w-3.5 h-3.5 text-brand-gold" />}
            hint="Contact number for this property."
          >
            <input
              type="tel"
              placeholder="+961 3 123 456"
              value={form.phone_number}
              onChange={handleChange('phone_number')}
              className={inputBase}
            />
          </FieldWrap>

          <FieldWrap
            label="Involved Brokers?"
            icon={<Users className="w-3.5 h-3.5 text-brand-gold" />}
            hint="Are there other brokers involved?"
          >
            <div className="flex gap-3 h-[42px]">
              <button
                type="button"
                onClick={() => set('involved_brokers', true)}
                className={clsx(
                  'flex-1 rounded-lg text-sm font-semibold border transition-all duration-200',
                  form.involved_brokers
                    ? 'bg-brand-gold border-brand-gold text-white shadow-md shadow-brand-gold/20'
                    : 'dark:bg-zinc-800/60 bg-zinc-50 dark:border-zinc-700 border-zinc-300 dark:text-zinc-400 text-zinc-600 hover:border-brand-gold/50'
                )}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => set('involved_brokers', false)}
                className={clsx(
                  'flex-1 rounded-lg text-sm font-semibold border transition-all duration-200',
                  !form.involved_brokers
                    ? 'bg-brand-gold border-brand-gold text-white shadow-md shadow-brand-gold/20'
                    : 'dark:bg-zinc-800/60 bg-zinc-50 dark:border-zinc-700 border-zinc-300 dark:text-zinc-400 text-zinc-600 hover:border-brand-gold/50'
                )}
              >
                No
              </button>
            </div>
          </FieldWrap>
        </div>

        {/* Row 8: Natoor Notes — Private */}
        <FieldWrap
          label="Natoor / Broker Notes"
          icon={<Lock className="w-3.5 h-3.5 text-amber-500" />}
          hint="PRIVATE — Internal broker notes only. Not visible to the public."
        >
          <div className="relative">
            <textarea
              rows={3}
              placeholder="Access codes, concierge contacts, owner background, key handover notes…"
              value={form.natoor_notes}
              onChange={handleChange('natoor_notes')}
              className={`${inputBase} resize-none border-amber-900/40 focus:ring-amber-600/40 focus:border-amber-700`}
            />
            <div className="absolute top-2.5 right-3 flex items-center gap-1 pointer-events-none">
              <Lock className="w-3 h-3 text-amber-600/60" />
            </div>
          </div>
        </FieldWrap>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 bg-red-950/50 border border-red-800/60 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg text-sm font-medium dark:text-zinc-400 text-zinc-600 dark:hover:text-white hover:text-zinc-900 dark:hover:bg-zinc-800 hover:bg-zinc-100 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              background: loading
                ? 'rgba(146,118,51,0.6)'
                : 'linear-gradient(135deg, #927633 0%, #b8922a 50%, #927633 100%)',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(146,118,51,0.30)',
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEditMode ? 'Saving…' : 'Adding…'}
              </>
            ) : isEditMode ? (
              'Save Changes'
            ) : (
              'Add Property'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

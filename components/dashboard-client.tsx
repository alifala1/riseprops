'use client';

import { useState, useMemo } from 'react';
import { Property, PropertyLocation, PropertyType } from '@/types';
import PropertyCard from '@/components/ui/property-card';
import PropertyFormModal from '@/components/ui/property-form-modal';
import { supabase } from '@/lib/supabaseClient';
import {
  Search,
  Plus,
  Building2,
  TrendingUp,
  DollarSign,
  Home,
  ChevronDown,
  Filter,
  MapPin,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';

interface DashboardClientProps {
  initialProperties: Property[];
  userId: string;
}

type TypeFilter = 'All' | PropertyType;
type LocationFilter = 'All' | PropertyLocation;
type StatusFilter = 'All' | 'Available' | 'Pending' | 'Sold' | 'Rented';

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

const LOCATIONS: LocationFilter[] = [
  'All',
  'Dekwaneh',
  'Sin el Fil',
  'Horch Tabet',
  'Surrounding Areas',
];
const STATUSES: StatusFilter[] = ['All', 'Available', 'Pending', 'Sold', 'Rented'];

export default function DashboardClient({
  initialProperties,
  userId,
}: DashboardClientProps) {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // ── Metrics ──────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const active = properties.filter(
      (p) => p.status === 'Available' || p.status === 'Pending'
    );
    const salePortfolio = properties
      .filter((p) => p.property_type === 'Sale')
      .reduce((sum, p) => sum + p.price, 0);
    
    const availableSaleSum = properties
      .filter((p) => p.property_type === 'Sale' && (p.status === 'Available' || p.status === 'Pending'))
      .reduce((sum, p) => sum + p.price, 0);

    const availableRentSum = properties
      .filter((p) => p.property_type === 'Rent' && (p.status === 'Available' || p.status === 'Pending'))
      .reduce((sum, p) => sum + p.price, 0);

    const totalCommission = (0.05 * availableSaleSum) + (2 * availableRentSum);

    return { active: active.length, salePortfolio, totalCommission };
  }, [properties]);

  // ── Filtered list ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return properties.filter((p) => {
      if (
        q &&
        !p.title.toLowerCase().includes(q) &&
        !(p.natoor_notes?.toLowerCase().includes(q)) &&
        !(p.description?.toLowerCase().includes(q))
      ) {
        return false;
      }
      if (typeFilter !== 'All' && p.property_type !== typeFilter) return false;
      if (locationFilter !== 'All' && p.location !== locationFilter)
        return false;
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      return true;
    });
  }, [properties, search, typeFilter, locationFilter, statusFilter]);

  const hasActiveFilters = Boolean(
    search || typeFilter !== 'All' || locationFilter !== 'All' || statusFilter !== 'All'
  );

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('All');
    setLocationFilter('All');
    setStatusFilter('All');
  };

  // ── CRUD handlers ─────────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditingProperty(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (property: Property) => {
    setEditingProperty(property);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingProperty(null);
  };

  const handleSuccess = (updated: Property, mode: 'add' | 'edit') => {
    if (mode === 'add') {
      setProperties((prev) => [updated, ...prev]);
    } else {
      setProperties((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic removal
    setProperties((prev) => prev.filter((p) => p.id !== id));
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      // Rollback on failure
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (data) setProperties(data as Property[]);
    }
  };

  return (
    <div className="min-h-screen dark:bg-brand-dark-bg bg-brand-light-bg">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── Page Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold dark:text-white text-brand-charcoal tracking-tight">
              Properties Portfolio
            </h1>
            <p className="mt-1 text-sm dark:text-zinc-500 text-zinc-400">
              {properties.length} listing{properties.length !== 1 ? 's' : ''}{' '}
              across your farm area
            </p>
          </div>
          <button
            id="add-property-btn"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shrink-0"
            style={{
              background:
                'linear-gradient(135deg, #927633 0%, #b8922a 50%, #927633 100%)',
              boxShadow: '0 4px 20px rgba(146,118,51,0.35)',
            }}
          >
            <Plus className="w-4 h-4" />
            Add New Property
          </button>
        </div>

        {/* ── Metrics Banner ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Active Listings */}
          <MetricCard
            label="Active Listings"
            value={String(metrics.active)}
            icon={<Building2 className="w-5 h-5" />}
            color="gold"
            sub={`${properties.length} total properties`}
          />
          {/* Sale Portfolio */}
          <MetricCard
            label="Sale Portfolio Value"
            value={formatCurrency(metrics.salePortfolio)}
            icon={<DollarSign className="w-5 h-5" />}
            color="emerald"
            sub="Aggregate of all Sale listings"
          />
          {/* Total Commission */}
          <MetricCard
            label="Total Available Commission"
            value={formatCurrency(metrics.totalCommission)}
            icon={<TrendingUp className="w-5 h-5" />}
            color="amber"
            sub="5% Sale + 2x Monthly Rent"
          />
        </div>

        {/* ── Control Bar ── */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-zinc-500 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search title, notes, description…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl dark:bg-zinc-900 bg-white dark:border-zinc-800 border-zinc-200 border dark:text-white text-zinc-900 dark:placeholder:text-zinc-600 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-sm transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type toggle pills */}
            <div className="flex gap-1.5 dark:bg-zinc-900 bg-white dark:border-zinc-800 border-zinc-200 border rounded-xl p-1">
              {(['All', 'Sale', 'Rent'] as TypeFilter[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={clsx(
                    'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                    typeFilter === t
                      ? 'bg-brand-gold text-white shadow-sm'
                      : 'dark:text-zinc-500 text-zinc-500 hover:dark:text-white hover:text-zinc-900'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Location dropdown */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400 pointer-events-none" />
              <select
                value={locationFilter}
                onChange={(e) =>
                  setLocationFilter(e.target.value as LocationFilter)
                }
                className="pl-8 pr-8 py-2.5 rounded-xl dark:bg-zinc-900 bg-white dark:border-zinc-800 border-zinc-200 border dark:text-zinc-300 text-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-sm appearance-none cursor-pointer transition-all"
              >
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l === 'All' ? 'All Locations' : l}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400 pointer-events-none" />
            </div>

            {/* Status dropdown */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                className="pl-8 pr-8 py-2.5 rounded-xl dark:bg-zinc-900 bg-white dark:border-zinc-800 border-zinc-200 border dark:text-zinc-300 text-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-sm appearance-none cursor-pointer transition-all"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === 'All' ? 'All Statuses' : s}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400 pointer-events-none" />
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium dark:text-zinc-500 text-zinc-500 dark:hover:text-white hover:text-zinc-900 dark:bg-zinc-900 bg-white dark:border-zinc-800 border-zinc-200 border transition-all"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Result count */}
          <p className="text-xs dark:text-zinc-600 text-zinc-400 pl-1">
            Showing {filtered.length} of {properties.length} properties
            {hasActiveFilters && ' · Filters active'}
          </p>
        </div>

        {/* ── Property Grid ── */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} onAdd={handleOpenAdd} />
        )}
      </div>

      {/* ── Form Modal ── */}
      <PropertyFormModal
        isOpen={isModalOpen}
        onClose={handleClose}
        property={editingProperty}
        userId={userId}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

// ── Metric Card ─────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'gold' | 'emerald' | 'amber';
  sub: string;
}

const colorMap = {
  gold: {
    icon: 'text-brand-gold bg-brand-gold/10 border-brand-gold/20',
    value: 'text-brand-gold',
  },
  emerald: {
    icon: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/40',
    value: 'text-emerald-400',
  },
  amber: {
    icon: 'text-amber-400 bg-amber-950/40 border-amber-900/40',
    value: 'text-amber-400',
  },
};

function MetricCard({ label, value, icon, color, sub }: MetricCardProps) {
  const c = colorMap[color];
  return (
    <div className="dark:bg-zinc-900/60 bg-white dark:border-zinc-800 border-zinc-200 border rounded-xl p-5 flex items-start gap-4 hover:scale-[1.01] transition-all duration-200">
      <div
        className={clsx(
          'w-10 h-10 rounded-lg flex items-center justify-center border shrink-0',
          c.icon
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs dark:text-zinc-500 text-zinc-500 font-medium tracking-wide uppercase mb-1">
          {label}
        </p>
        <p className={clsx('text-2xl font-bold tracking-tight truncate', c.value)}>
          {value}
        </p>
        <p className="text-xs dark:text-zinc-600 text-zinc-400 mt-1 truncate">
          {sub}
        </p>
      </div>
    </div>
  );
}

// ── Empty State ─────────────────────────────────────────────────────

function EmptyState({
  hasFilters,
  onClear,
  onAdd,
}: {
  hasFilters: boolean;
  onClear: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div className="w-20 h-20 rounded-2xl dark:bg-zinc-900 bg-white dark:border-zinc-800 border-zinc-200 border flex items-center justify-center">
        <Home
          className="w-9 h-9 dark:text-zinc-700 text-zinc-300"
          strokeWidth={1}
        />
      </div>
      <div>
        <p className="text-lg font-semibold dark:text-zinc-300 text-zinc-600">
          {hasFilters
            ? 'No matching properties'
            : 'No properties tracked in this farm area yet'}
        </p>
        <p className="text-sm dark:text-zinc-600 text-zinc-400 mt-1 max-w-sm">
          {hasFilters
            ? 'Try adjusting your search or filter criteria.'
            : 'Start building your portfolio by adding your first listing.'}
        </p>
      </div>
      {hasFilters ? (
        <button
          onClick={onClear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-300 text-zinc-700 dark:hover:bg-zinc-700 hover:bg-zinc-200 transition-all"
        >
          <X className="w-4 h-4" />
          Clear Filters
        </button>
      ) : (
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
          style={{
            background:
              'linear-gradient(135deg, #927633 0%, #b8922a 50%, #927633 100%)',
            boxShadow: '0 4px 16px rgba(146,118,51,0.30)',
          }}
        >
          <Plus className="w-4 h-4" />
          Add Your First Property
        </button>
      )}
    </div>
  );
}


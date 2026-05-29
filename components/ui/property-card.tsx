'use client';

import { Property } from '@/types';
import {
  MapPin,
  Tag,
  DollarSign,
  Lock,
  Edit2,
  Trash2,
  Clock,
  Home,
  ChevronDown,
  ChevronUp,
  Map as MapIcon,
  ExternalLink,
  Phone,
  Users,
  Download,
  X,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
}

const statusConfig: Record<
  Property['status'],
  { label: string; className: string }
> = {
  Available: {
    label: 'Available',
    className:
      'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
  },
  Pending: {
    label: 'Pending',
    className: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
  },
  Sold: {
    label: 'Sold',
    className: 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60',
  },
  Rented: {
    label: 'Rented',
    className: 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60',
  },
};

function formatPrice(price: number, type: Property['property_type']): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    notation: price >= 1_000_000 ? 'compact' : 'standard',
  }).format(price);
  return type === 'Rent' ? `${formatted}/mo` : formatted;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getMapEmbedUrl(input: string, property: Property): string {
  if (input.includes('<iframe') && input.includes('src="')) {
    return input.match(/src="([^"]+)"/)?.[1] || '';
  }
  if (input.includes('embed')) return input;
  
  const coordsMatch = input.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordsMatch) {
    const lat = coordsMatch[1];
    const lng = coordsMatch[2];
    return `https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }

  const query = encodeURIComponent(`${property.title}, ${property.location}, Lebanon`);
  return `https://maps.google.com/maps?q=${query}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
}

export default function PropertyCard({
  property,
  onEdit,
  onDelete,
}: PropertyCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [downloadingImages, setDownloadingImages] = useState(false);

  const imageUrls = property.image_urls?.length 
    ? property.image_urls 
    : (property.image_url ? [property.image_url] : []);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
  };
  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  const status = statusConfig[property.status];

  const handleDelete = async () => {
    if (!confirm(`Delete "${property.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    onDelete(property.id);
  };

  const handleDownloadZip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imageUrls.length === 0) return;
    
    try {
      setDownloadingImages(true);
      const zip = new JSZip();
      
      const fetchPromises = imageUrls.map(async (url, index) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image ${index + 1}`);
        const blob = await response.blob();
        
        const urlParts = url.split('/');
        let filename = urlParts[urlParts.length - 1].split('?')[0];
        if (!filename) filename = `image-${index + 1}.jpg`;
        else filename = `${index + 1}-${filename}`;
        
        zip.file(filename, blob);
      });
      
      await Promise.all(fetchPromises);
      const content = await zip.generateAsync({ type: 'blob' });
      const safeTitle = property.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'property';
      saveAs(content, `${safeTitle}_images.zip`);
    } catch (error) {
      console.error("Error downloading images:", error);
      alert("Failed to download images. Please try again.");
    } finally {
      setDownloadingImages(false);
    }
  };

  return (
    <article
      className={clsx(
        'group relative flex flex-col',
        'bg-white dark:bg-zinc-900/60',
        'border border-zinc-200 dark:border-zinc-800',
        'rounded-xl overflow-hidden',
        'hover:scale-[1.01] hover:shadow-xl hover:shadow-black/30 dark:hover:border-zinc-700 hover:border-zinc-300',
        'transition-all duration-200',
        deleting && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Image / Carousel / Placeholder */}
      <div className="relative h-44 bg-zinc-100 dark:bg-zinc-800/50 overflow-hidden group/carousel">
        {imageUrls.length > 0 ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrls[currentImageIndex]}
              alt={`${property.title} - Image ${currentImageIndex + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(true);
              }}
              className="w-full h-full object-cover transition-opacity duration-300 cursor-pointer"
            />
            {imageUrls.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm transition-all opacity-0 group-hover/carousel:opacity-100"
                >
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm transition-all opacity-0 group-hover/carousel:opacity-100"
                >
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                  {imageUrls.map((_, i) => (
                    <div
                      key={i}
                      className={clsx(
                        "w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-sm",
                        i === currentImageIndex ? "bg-white scale-125" : "bg-white/50"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 gap-2 bg-zinc-100 dark:bg-zinc-800/20">
            <Home className="w-8 h-8 opacity-50" />
            <span className="text-[10px] font-bold tracking-widest uppercase">No Images</span>
          </div>
        )}

        {/* Type badge */}
        <div
          className={clsx(
            'absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider',
            property.property_type === 'Sale'
              ? 'bg-brand-gold text-white'
              : 'bg-zinc-900/90 text-brand-gold border border-brand-gold/50'
          )}
        >
          {property.property_type === 'Sale' ? '● FOR SALE' : '○ FOR RENT'}
        </div>

        {/* Status badge */}
        <div
          className={clsx(
            'absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs font-semibold border',
            status.className
          )}
        >
          {status.label}
        </div>

        {/* Action buttons — permanently visible */}
        <div className="absolute bottom-3 right-3 flex gap-2 transition-opacity duration-200">
          {imageUrls.length > 0 && (
            <button
              onClick={handleDownloadZip}
              disabled={downloadingImages}
              aria-label="Download all images"
              className="w-8 h-8 rounded-lg bg-zinc-900/90 backdrop-blur-sm flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-700 transition-all duration-150 disabled:opacity-50"
            >
              {downloadingImages ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          <button
            onClick={() => onEdit(property)}
            aria-label="Edit property"
            className="w-8 h-8 rounded-lg bg-zinc-900/90 backdrop-blur-sm flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-700 transition-all duration-150"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            aria-label="Delete property"
            className="w-8 h-8 rounded-lg bg-zinc-900/90 backdrop-blur-sm flex items-center justify-center text-zinc-300 hover:text-red-400 hover:bg-red-950/60 border border-zinc-700 hover:border-red-800/60 transition-all duration-150"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Title */}
        <h3 className="font-semibold dark:text-white text-brand-charcoal text-base leading-snug line-clamp-2">
          {property.title}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-brand-gold shrink-0" />
          <span className="text-brand-gold font-bold text-lg">
            {formatPrice(property.price, property.property_type)}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 text-xs dark:text-zinc-400 text-zinc-500">
            <MapPin className="w-3 h-3 shrink-0" />
            {property.location}
          </span>
          <span className="flex items-center gap-1 text-xs dark:text-zinc-400 text-zinc-500">
            <Tag className="w-3 h-3 shrink-0" />
            {property.category}
          </span>
          {property.phone_number && (
            <span className="flex items-center gap-1 text-xs dark:text-zinc-400 text-zinc-500">
              <Phone className="w-3 h-3 shrink-0" />
              {property.phone_number}
            </span>
          )}
          {property.involved_brokers && (
            <span className="flex items-center gap-1 text-xs dark:text-brand-gold text-brand-gold font-medium">
              <Users className="w-3 h-3 shrink-0" />
              Brokers
            </span>
          )}
        </div>

        {/* Description */}
        {property.description && (
          <p className="text-xs dark:text-zinc-500 text-zinc-400 leading-relaxed whitespace-pre-wrap">
            {property.description}
          </p>
        )}

        {/* Natoor Notes — Private section */}
        {property.natoor_notes && (
          <div className="mt-auto">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors duration-150"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-amber-600 dark:text-amber-500 shrink-0" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-500 tracking-wide uppercase">
                  Private · Broker Notes
                </span>
              </div>
              {showNotes ? (
                <ChevronUp className="w-3 h-3 text-amber-600" />
              ) : (
                <ChevronDown className="w-3 h-3 text-amber-600" />
              )}
            </button>
            {showNotes && (
              <div className="mt-2 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                <p className="text-xs text-amber-900 dark:text-amber-200/70 leading-relaxed whitespace-pre-wrap">
                  {property.natoor_notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Google Maps Embed */}
        {property.google_maps_url && (
          <div className="mt-auto">
            <button
              onClick={() => setShowMap(!showMap)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors duration-150"
            >
              <div className="flex items-center gap-2">
                <MapIcon className="w-3 h-3 text-zinc-500 shrink-0" />
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 tracking-wide uppercase">
                  Location Map
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={property.google_maps_url.includes('<') ? '#' : property.google_maps_url} 
                  target="_blank" 
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-brand-gold hover:text-brand-gold/80"
                  title="Open in Google Maps"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                {showMap ? (
                  <ChevronUp className="w-3 h-3 text-zinc-500" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-zinc-500" />
                )}
              </div>
            </button>
            {showMap && (
              <div className="mt-2 w-full h-48 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={getMapEmbedUrl(property.google_maps_url, property)}
                />
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 mt-auto border-t dark:border-zinc-800 border-zinc-100 flex items-center gap-1 text-xs dark:text-zinc-600 text-zinc-400">
          <Clock className="w-3 h-3 shrink-0" />
          Added {formatDate(property.created_at)}
        </div>
      </div>
      
      {/* Fullscreen Lightbox Portal */}
      {lightboxOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
        >
          <button 
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
          >
            <X className="w-6 h-6" />
          </button>
          
          {imageUrls.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              <ChevronDown className="w-8 h-8 rotate-90" />
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrls[currentImageIndex]}
            alt={`Fullscreen ${property.title}`}
            className="max-w-[90vw] max-h-[90vh] object-contain cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
          
          {imageUrls.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              <ChevronDown className="w-8 h-8 -rotate-90" />
            </button>
          )}
          
          {imageUrls.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
              {imageUrls.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
                  className={clsx(
                    "w-2.5 h-2.5 rounded-full transition-all duration-300",
                    i === currentImageIndex ? "bg-brand-gold scale-125" : "bg-white/50 hover:bg-white/80"
                  )}
                />
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </article>
  );
}

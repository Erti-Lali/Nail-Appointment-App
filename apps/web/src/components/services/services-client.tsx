"use client";

import { useState } from "react";
import {
  Plus, Scissors, Clock, Tag, ToggleLeft, ToggleRight,
  Star, Edit2, Trash2, ChevronDown, ChevronRight,
} from "lucide-react";
import { formatPrice, minutesToDisplay } from "@nailstudio/shared";
import { cn } from "@/lib/utils";
import { ServiceFormModal } from "./service-form-modal";
import { CategoryFormModal } from "./category-form-modal";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ServicesClientProps {
  categories: any[];
  services: any[];
  tenantId: string;
}

export function ServicesClient({ categories: initCats, services: initSvcs, tenantId }: ServicesClientProps) {
  const supabase = createClient();
  const [categories, setCategories] = useState(initCats);
  const [services, setServices] = useState(initSvcs);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(initCats.map((c) => c.id)));
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);

  const toggleCategory = (id: string) =>
    setExpandedCats((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleFeatured = async (service: any) => {
    const { error } = await supabase
      .from("services")
      .update({ is_featured: !service.is_featured })
      .eq("id", service.id);
    if (!error) setServices((prev) => prev.map((s) => s.id === service.id ? { ...s, is_featured: !s.is_featured } : s));
  };

  const toggleActive = async (service: any) => {
    const { error } = await supabase
      .from("services")
      .update({ is_active: !service.is_active })
      .eq("id", service.id);
    if (!error) setServices((prev) => prev.map((s) => s.id === service.id ? { ...s, is_active: !s.is_active } : s));
  };

  const uncategorized = services.filter((s) => !categories.find((c) => c.id === s.category_id));

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="badge bg-gold-500/20 text-gold-500">
            {services.filter((s) => s.is_active).length} aktif hizmet
          </span>
          <span className="badge bg-black-border text-white/50">
            {categories.length} kategori
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="btn-ghost flex items-center gap-2 text-sm py-2"
          >
            <Tag className="w-4 h-4" />
            Kategori Ekle
          </button>
          <button
            onClick={() => { setEditingService(null); setShowServiceModal(true); }}
            className="btn-gold flex items-center gap-2 text-sm py-2"
          >
            <Plus className="w-4 h-4" />
            Hizmet Ekle
          </button>
        </div>
      </div>

      {/* Categories + services */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const catServices = services.filter((s) => s.category_id === cat.id);
          const isExpanded = expandedCats.has(cat.id);

          return (
            <div key={cat.id} className="card p-0 overflow-hidden">
              {/* Category header */}
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-black/30 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: cat.color ? `${cat.color}20` : "rgba(201,168,76,0.15)" }}
                >
                  {cat.icon ?? "✨"}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-semibold">{cat.name}</p>
                  <p className="text-white/30 text-xs">{catServices.length} hizmet</p>
                </div>
                <div className={cn("transition-transform duration-200", isExpanded && "rotate-180")}>
                  <ChevronDown className="w-4 h-4 text-white/30" />
                </div>
              </button>

              {/* Services */}
              {isExpanded && (
                <div className="border-t border-black-border divide-y divide-black-border/50">
                  {catServices.length === 0 ? (
                    <div className="px-5 py-6 text-center">
                      <p className="text-white/20 text-sm">Bu kategoride henüz hizmet yok</p>
                      <button
                        onClick={() => { setEditingService(null); setShowServiceModal(true); }}
                        className="text-gold-500 text-xs mt-2 hover:underline"
                      >
                        Hizmet ekle →
                      </button>
                    </div>
                  ) : (
                    catServices.map((service) => (
                      <ServiceRow
                        key={service.id}
                        service={service}
                        onToggleFeatured={() => toggleFeatured(service)}
                        onToggleActive={() => toggleActive(service)}
                        onEdit={() => { setEditingService(service); setShowServiceModal(true); }}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {categories.length === 0 && (
          <div className="card text-center py-16">
            <Scissors className="w-12 h-12 mx-auto mb-4 text-white/10" />
            <p className="text-white/40 mb-4">Henüz kategori ve hizmet eklenmemiş</p>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="btn-gold mx-auto"
            >
              İlk Kategoriyi Ekle
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showServiceModal && (
        <ServiceFormModal
          tenantId={tenantId}
          categories={categories}
          editingService={editingService}
          onClose={() => { setShowServiceModal(false); setEditingService(null); }}
          onSuccess={(service) => {
            if (editingService) {
              setServices((prev) => prev.map((s) => s.id === service.id ? service : s));
            } else {
              setServices((prev) => [...prev, service]);
            }
            setShowServiceModal(false);
            setEditingService(null);
          }}
        />
      )}

      {showCategoryModal && (
        <CategoryFormModal
          tenantId={tenantId}
          onClose={() => setShowCategoryModal(false)}
          onSuccess={(cat) => {
            setCategories((prev) => [...prev, cat]);
            setExpandedCats((prev) => new Set([...prev, cat.id]));
            setShowCategoryModal(false);
          }}
        />
      )}
    </div>
  );
}

function ServiceRow({
  service, onToggleFeatured, onToggleActive, onEdit,
}: {
  service: any;
  onToggleFeatured: () => void;
  onToggleActive: () => void;
  onEdit: () => void;
}) {
  return (
    <div className={cn(
      "grid grid-cols-2 md:grid-cols-[1fr_100px_100px_120px_auto] gap-2 md:gap-4 items-center px-4 md:px-5 py-3.5 transition-colors",
      !service.is_active && "opacity-40"
    )}>
      {/* Name */}
      <div className="col-span-2 md:col-span-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white font-medium text-sm">{service.name}</p>
          {service.is_featured && (
            <Star className="w-3 h-3 text-gold-500 fill-gold-500" />
          )}
        </div>
        {service.description && (
          <p className="text-white/30 text-xs mt-0.5 truncate max-w-xs">{service.description}</p>
        )}
      </div>

      {/* Duration */}
      <div className="flex items-center gap-1.5 text-white/50 text-sm">
        <Clock className="w-3.5 h-3.5" />
        {minutesToDisplay(service.duration_minutes)}
      </div>

      {/* Price */}
      <div className="text-gold-500 font-semibold text-sm">
        {formatPrice(service.price, "TRY")}
        {service.price_max && (
          <span className="text-white/30"> – {formatPrice(service.price_max, "TRY")}</span>
        )}
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleFeatured}
          title="Öne Çıkar"
          className={cn("transition-colors", service.is_featured ? "text-gold-500" : "text-white/20 hover:text-white/50")}
        >
          <Star className="w-4 h-4" />
        </button>
        <button onClick={onToggleActive}>
          {service.is_active
            ? <ToggleRight className="w-6 h-6 text-gold-500" />
            : <ToggleLeft className="w-6 h-6 text-white/30" />
          }
        </button>
      </div>

      {/* Edit */}
      <button
        onClick={onEdit}
        className="text-white/20 hover:text-white/60 transition-colors justify-self-end md:justify-self-auto"
      >
        <Edit2 className="w-4 h-4" />
      </button>
    </div>
  );
}

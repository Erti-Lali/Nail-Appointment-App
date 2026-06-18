"use client";

import { useState } from "react";
import {
  Plus, Image as ImageIcon, X, Loader2, Trash2, Eye, EyeOff, ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Enum } from "@/lib/database.types";

const TYPES: { id: string; label: string }[] = [
  { id: "gallery", label: "Galeri" },
  { id: "before_after", label: "Öncesi/Sonrası" },
  { id: "announcement", label: "Duyuru" },
  { id: "offer", label: "Kampanya" },
];

const typeLabel = (t: string) => TYPES.find((x) => x.id === t)?.label ?? t;

const inputCls = "w-full bg-surface-soft border border-line rounded-xl px-4 py-2.5 text-ink placeholder:text-ink-subtle outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all";
const labelCls = "block text-sm font-medium text-ink-muted mb-1.5";

export function ContentClient({ tenantId, initialContent }: { tenantId: string; initialContent: any[] }) {
  const supabase = createClient();
  const [items, setItems] = useState<any[]>(initialContent);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);
  const publishedCount = items.filter((i) => i.is_published).length;

  const togglePublish = async (item: any) => {
    const next = !item.is_published;
    const { error } = await supabase
      .from("tenant_content")
      .update({ is_published: next, published_at: next ? new Date().toISOString() : null })
      .eq("id", item.id);
    if (error) return toast.error("Güncellenemedi");
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_published: next } : i));
    toast.success(next ? "Yayınlandı" : "Yayından kaldırıldı");
  };

  const remove = async (item: any) => {
    if (!confirm("Bu içeriği silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from("tenant_content").delete().eq("id", item.id);
    if (error) return toast.error("Silinemedi");
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    toast.success("İçerik silindi");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">İçerik Yönetimi</h1>
          <p className="text-ink-subtle mt-1">Galeri, kampanya ve duyurularınız</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-brand hover:bg-brand-dark text-white font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Yeni İçerik
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="badge bg-brand/15 text-brand">{publishedCount} yayında</span>
        <span className="badge bg-line text-ink-muted">{items.length} toplam</span>
        <div className="flex-1" />
        {[{ id: "all", label: "Tümü" }, ...TYPES].map((t) => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              filter === t.id ? "bg-brand/10 border-brand/40 text-brand" : "border-line text-ink-subtle hover:border-brand/30")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card border border-line text-center py-16">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-brand/20" />
          <p className="text-ink-subtle mb-4">Henüz içerik eklenmemiş</p>
          <button onClick={() => setShowModal(true)} className="bg-brand hover:bg-brand-dark text-white font-semibold px-4 py-2.5 rounded-xl mx-auto inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> İlk İçeriği Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="card p-0 overflow-hidden border border-line group">
              <div className="relative aspect-square bg-surface-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image_url} alt={item.title ?? ""} className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }} />
                <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface/90 text-ink-muted">
                  {typeLabel(item.type)}
                </span>
                {!item.is_published && (
                  <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-ink/70 text-white">Taslak</span>
                )}
                <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button onClick={() => togglePublish(item)} title={item.is_published ? "Yayından kaldır" : "Yayınla"}
                    className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center text-ink-muted hover:text-brand">
                    {item.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {item.link_url && (
                    <a href={item.link_url} target="_blank" rel="noreferrer" title="Bağlantıyı aç"
                      className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center text-ink-muted hover:text-brand">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button onClick={() => remove(item)} title="Sil"
                    className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center text-red-500 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {(item.title || item.description) && (
                <div className="p-3">
                  {item.title && <p className="text-sm font-semibold text-ink truncate">{item.title}</p>}
                  {item.description && <p className="text-xs text-ink-subtle truncate mt-0.5">{item.description}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ContentModal
          tenantId={tenantId}
          onClose={() => setShowModal(false)}
          onSuccess={(created) => { setItems((prev) => [created, ...prev]); setShowModal(false); }}
        />
      )}
    </div>
  );
}

function ContentModal({ tenantId, onClose, onSuccess }: { tenantId: string; onClose: () => void; onSuccess: (c: any) => void }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ type: "gallery", title: "", description: "", image_url: "", link_url: "", is_published: true });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url.trim()) return toast.error("Görsel bağlantısı gerekli");
    setLoading(true);
    const { data, error } = await supabase
      .from("tenant_content")
      .insert({
        tenant_id: tenantId,
        type: form.type as Enum<"content_type">,
        title: form.title.trim() || null,
        description: form.description.trim() || null,
        image_url: form.image_url.trim(),
        link_url: form.link_url.trim() || null,
        is_published: form.is_published,
        published_at: form.is_published ? new Date().toISOString() : null,
      })
      .select().single();
    setLoading(false);
    if (error) toast.error("Eklenemedi", { description: error.message });
    else { toast.success("İçerik eklendi"); onSuccess(data); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-line rounded-2xl shadow-xl overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="font-semibold text-ink">Yeni İçerik</h2>
          <button onClick={onClose} className="text-ink-subtle hover:text-ink"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4 max-h-[calc(90vh-130px)] overflow-y-auto">
          <div>
            <label className={labelCls}>Tür</label>
            <div className="flex gap-2 flex-wrap">
              {TYPES.map((t) => (
                <button key={t.id} type="button" onClick={() => setForm((f) => ({ ...f, type: t.id }))}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    form.type === t.id ? "bg-brand/10 border-brand/40 text-brand" : "border-line text-ink-subtle")}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Görsel Bağlantısı (URL) *</label>
            <input className={inputCls} value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="https://..." required />
          </div>
          {form.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.image_url} alt="" className="w-full h-40 object-cover rounded-xl border border-line"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          )}
          <div>
            <label className={labelCls}>Başlık</label>
            <input className={inputCls} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Örn: Yaz kampanyası" />
          </div>
          <div>
            <label className={labelCls}>Açıklama</label>
            <textarea rows={2} className={inputCls + " resize-none"} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Kısa açıklama..." />
          </div>
          <div>
            <label className={labelCls}>Bağlantı (opsiyonel)</label>
            <input className={inputCls} value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))} placeholder="https://instagram.com/..." />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
              className="w-4 h-4 accent-brand" />
            <span className="text-sm text-ink-muted">Hemen yayınla</span>
          </label>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-line text-ink-muted hover:border-brand font-medium py-2.5 rounded-xl bg-surface">İptal</button>
            <button type="submit" disabled={loading} className="flex-1 bg-brand hover:bg-brand-dark text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

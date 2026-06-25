import { LegalShell, LegalSection } from "@/components/legal/legal-shell";

export const metadata = { title: "KVKK Aydınlatma Metni — NailStudio 101" };

export default function KvkkPage() {
  return (
    <LegalShell title="KVKK Aydınlatma Metni" updated="2026-06-25">
      <p>
        6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca, kişisel
        verileriniz veri sorumlusu sıfatıyla [Şirket/Stüdyo Adı] tarafından aşağıda açıklanan
        kapsamda işlenmektedir.
      </p>

      <LegalSection heading="1. Veri Sorumlusu">
        <p>[Şirket/Stüdyo Adı] — [Adres] — [E-posta] — [Telefon]</p>
      </LegalSection>

      <LegalSection heading="2. İşlenen Kişisel Veriler">
        <ul className="list-disc pl-5 space-y-1">
          <li>Kimlik: ad, soyad</li>
          <li>İletişim: telefon, e-posta</li>
          <li>Randevu bilgileri: seçilen hizmet, personel, tarih/saat, notlar</li>
          <li>İsteğe bağlı yüklediğiniz referans/ilham görselleri</li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. İşleme Amaçları">
        <p>
          Randevu oluşturma ve yönetimi, hizmet sunumu, randevu hatırlatmaları (SMS/e-posta/push),
          müşteri ilişkileri ve yasal yükümlülüklerin yerine getirilmesi.
        </p>
      </LegalSection>

      <LegalSection heading="4. Hukuki Sebep">
        <p>
          Sözleşmenin kurulması/ifası, meşru menfaat ve açık rızanız (KVKK m.5). Pazarlama amaçlı
          iletişim yalnızca açık rızanızla yapılır.
        </p>
      </LegalSection>

      <LegalSection heading="5. Aktarım">
        <p>
          Verileriniz; hizmet aldığımız altyapı (Supabase), SMS (Netgsm) ve e-posta (Resend)
          sağlayıcıları gibi yurt içi/yurt dışı tedarikçilerle, yalnızca bu hizmetin sunulması için
          gerekli ölçüde paylaşılır.
        </p>
      </LegalSection>

      <LegalSection heading="6. Saklama Süresi">
        <p>İlgili mevzuatta öngörülen süreler boyunca; bu sürenin sonunda silinir veya anonimleştirilir.</p>
      </LegalSection>

      <LegalSection heading="7. Haklarınız (KVKK m.11)">
        <p>
          Verilerinize erişme, düzeltilmesini/silinmesini isteme, işlemeye itiraz etme ve aktarımı
          hakkındaki taleplerinizi [E-posta] adresine iletebilirsiniz.
        </p>
      </LegalSection>
    </LegalShell>
  );
}

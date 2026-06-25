import { LegalShell, LegalSection } from "@/components/legal/legal-shell";

export const metadata = { title: "Gizlilik Politikası — NailStudio 101" };

export default function GizlilikPage() {
  return (
    <LegalShell title="Gizlilik Politikası" updated="2026-06-25">
      <p>
        Bu Gizlilik Politikası, NailStudio 101 platformu ve üzerinden hizmet veren stüdyolar
        aracılığıyla topladığımız bilgileri nasıl kullandığımızı açıklar.
      </p>

      <LegalSection heading="Topladığımız Bilgiler">
        <ul className="list-disc pl-5 space-y-1">
          <li>Hesap bilgileri: ad, soyad, e-posta, telefon</li>
          <li>Randevu verileri: hizmet, personel, tarih/saat, notlar, referans görselleri</li>
          <li>Teknik veriler: oturum/çerez bilgileri (kimlik doğrulama için)</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Bilgileri Nasıl Kullanırız">
        <p>
          Randevularınızı oluşturmak ve yönetmek, hatırlatma göndermek, hizmeti iyileştirmek ve
          yasal yükümlülükleri yerine getirmek için kullanırız. Verilerinizi izniniz olmadan üçüncü
          taraflara satmayız.
        </p>
      </LegalSection>

      <LegalSection heading="Hizmet Sağlayıcılar">
        <p>
          Altyapı için Supabase, SMS için Netgsm, e-posta için Resend kullanılır. Bu sağlayıcılar
          verileri yalnızca bizim adımıza, hizmetin sunulması amacıyla işler.
        </p>
      </LegalSection>

      <LegalSection heading="Çerezler">
        <p>Oturumunuzu açık tutmak için tarayıcı depolaması/çerez kullanılır. Pazarlama çerezi kullanılmaz.</p>
      </LegalSection>

      <LegalSection heading="Haklarınız ve İletişim">
        <p>
          Verilerinize erişme, düzeltme ve silme talepleriniz için [E-posta] ile iletişime
          geçebilirsiniz. Detaylı bilgi için <a href="/kvkk" className="text-brand font-medium">KVKK Aydınlatma Metni</a>&apos;ne bakınız.
        </p>
      </LegalSection>
    </LegalShell>
  );
}

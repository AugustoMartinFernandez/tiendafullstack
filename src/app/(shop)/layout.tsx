import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AnnouncementBanner } from "@/components/ui/announcement-banner";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnnouncementBanner
        text="¡Llegó la nueva temporada! Envíos gratis superando $50.000."
        linkText="Ver colección"
        linkUrl="/tienda"
      />
      <Navbar storeName="Mi Tienda Pro" />
      <main>{children}</main>
      <Footer storeName="Mi Tienda Pro" />
    </>
  );
}
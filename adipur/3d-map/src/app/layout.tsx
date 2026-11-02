import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '3D Plot Layout',
  description: 'Interactive real-estate and farmland plot layout viewer with live availability, parcel inspection, and 3D visualization.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0d0f12] text-gray-100 overflow-hidden select-none antialiased">
        {children}
      </body>
    </html>
  );
}

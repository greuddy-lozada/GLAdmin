import type { Metadata } from 'next';
import { Toaster } from 'sileo';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { SerwistRoot } from '@/providers/serwist-provider';
import { I18nProvider } from '@/i18n/i18n-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cuadra',
  description: 'Sistema de Gestión Administrativa',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SerwistRoot>
          <I18nProvider>
            <ThemeProvider>
              <AuthProvider>
                <QueryProvider>{children}</QueryProvider>
              </AuthProvider>
            </ThemeProvider>
          </I18nProvider>
        </SerwistRoot>
        <Toaster position="top-right" theme="system" />
      </body>
    </html>
  );
}

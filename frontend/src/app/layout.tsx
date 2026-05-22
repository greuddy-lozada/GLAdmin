import type { Metadata } from 'next';
import { Toaster } from 'sileo';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { I18nProvider } from '@/i18n/i18n-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'GLAdmin',
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
        <I18nProvider>
          <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </I18nProvider>
        <Toaster position="top-right" theme="system" />
      </body>
    </html>
  );
}

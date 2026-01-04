'use client';

/**
 * Wrapper component para CSPR.click Web3 authentication.
 * 
 * Este componente configura el ClickProvider y expone el contexto
 * de autenticación Web3 a todos los componentes hijos.
 * 
 * Soporta:
 * - Casper Wallet
 * - Social Login (Google)
 */

import { ClickProvider } from '@make-software/csprclick-ui';
import { CsprClickInitOptions, CONTENT_MODE } from '@make-software/csprclick-core-types';
import { ReactNode } from 'react';

/**
 * Obtiene el appId de CSPR.click desde las variables de entorno.
 * 
 * @returns appId o undefined si no está configurado
 */
function getCSPRClickAppId(): string | undefined {
  const appId = process.env.NEXT_PUBLIC_CSPR_CLICK_APP_ID;
  return appId && appId.trim() !== '' ? appId : undefined;
}

/**
 * Opciones de configuración para CSPR.click
 */
function getClickOptions(): CsprClickInitOptions | null {
  const appId = getCSPRClickAppId();
  
  // Si no hay appId, retornar null para evitar errores 401
  if (!appId) {
    return null;
  }

  return {
    appName: 'Casper App',
    appId,
    contentMode: CONTENT_MODE.IFRAME,
    providers: ['casper-wallet', 'google'],
  };
}

/**
 * Props del componente ClickWrapper
 */
interface ClickWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper que proporciona el contexto de CSPR.click a la aplicación.
 * 
 * Si NEXT_PUBLIC_CSPR_CLICK_APP_ID no está configurado, renderiza los children
 * sin el provider para evitar errores 401.
 * 
 * @param children - Componentes hijos que tendrán acceso al contexto
 * @returns Componente con ClickProvider configurado o children directamente
 */
export function ClickWrapper({ children }: ClickWrapperProps) {
  const clickOptions = getClickOptions();

  // Si no hay appId configurado, renderizar children sin provider
  // Esto evita errores 401 en la consola
  if (!clickOptions) {
    return <>{children}</>;
  }

  return (
    <ClickProvider options={clickOptions}>
      {children}
    </ClickProvider>
  );
}


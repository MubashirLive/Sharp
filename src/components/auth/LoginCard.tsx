import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginCardProps {
  brandingIcon: ReactNode;
  brandingLabel?: string;
  title: string;
  subtitle?: string;
  /** Element rendered in top-right of card header (e.g. school logo) */
  headerRight?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function LoginCard({
  brandingIcon,
  brandingLabel,
  title,
  subtitle,
  headerRight,
  children,
  footer,
}: LoginCardProps) {
  return (
    <div className="login-page-bg px-4 py-10">
      <div className="w-full max-w-[26rem]">

        {/* Branding block */}
        <div className="flex flex-col items-center mb-7">
          <div className="login-branding-icon mb-4">
            {brandingIcon}
          </div>
          {brandingLabel && (
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--login-text-muted))] mb-1.5">
              {brandingLabel}
            </p>
          )}
          <h1 className="text-2xl font-bold text-[hsl(var(--login-text))] tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-[hsl(var(--login-text-muted))] mt-1 text-center max-w-xs leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Card */}
        <div className="login-card px-6 py-7">
          {headerRight ? (
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[hsl(var(--login-text))]">{title}</h2>
                {subtitle && (
                  <p className="text-sm text-[hsl(var(--login-text-muted))] mt-0.5">{subtitle}</p>
                )}
              </div>
              {headerRight}
            </div>
          ) : null}
          {children}
        </div>

        {footer && (
          <p className="text-center text-xs text-[hsl(var(--login-text-muted))] mt-5 leading-relaxed">
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}

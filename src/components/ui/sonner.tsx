"use client";

import * as React from "react";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-800 group-[.toaster]:border-slate-200/90 group-[.toaster]:shadow-xl group-[.toaster]:shadow-slate-900/5 group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:font-sans",
          title: "group-[.toast]:font-semibold group-[.toast]:text-slate-900 group-[.toast]:text-sm",
          description: "group-[.toast]:text-slate-500 group-[.toast]:text-xs group-[.toast]:mt-0.5",
          actionButton:
            "group-[.toast]:bg-emerald-600 group-[.toast]:text-white group-[.toast]:rounded-lg group-[.toast]:text-xs group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-600 group-[.toast]:rounded-lg group-[.toast]:text-xs group-[.toast]:font-medium",
          closeButton:
            "group-[.toast]:bg-white group-[.toast]:border-slate-200 group-[.toast]:text-slate-400 hover:group-[.toast]:text-slate-800 group-[.toast]:shadow-xs",
          success:
            "!bg-white !text-slate-800 !border-emerald-300/80 [&_[data-icon]]:!text-emerald-600",
          error:
            "!bg-white !text-slate-800 !border-rose-300/80 [&_[data-icon]]:!text-rose-600",
          info:
            "!bg-white !text-slate-800 !border-emerald-300/80 [&_[data-icon]]:!text-emerald-600",
          warning:
            "!bg-white !text-slate-800 !border-amber-300/80 [&_[data-icon]]:!text-amber-600",
        },
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#1e293b",
          "--normal-border": "#e2e8f0",
          "--success-bg": "#ffffff",
          "--success-text": "#1e293b",
          "--success-border": "#6ee7b7",
          "--error-bg": "#ffffff",
          "--error-text": "#1e293b",
          "--error-border": "#fda4af",
          "--info-bg": "#ffffff",
          "--info-text": "#1e293b",
          "--info-border": "#6ee7b7",
          "--warning-bg": "#ffffff",
          "--warning-text": "#1e293b",
          "--warning-border": "#fcd34d",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };


"use client";

import type { ChangeEventHandler } from "react";

type TextFieldProps = { label: string; type?: string; value?: string | number; onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>; required?: boolean; placeholder?: string; helperText?: string; multiline?: boolean; rows?: number; inputProps?: Record<string, unknown>; inputMode?: "text" | "numeric" | "decimal" | "email" | "tel" | "url"; fullWidth?: boolean; size?: "small"; className?: string };

export function TextField({ label, helperText, multiline, rows, inputProps, className = "", ...props }: TextFieldProps) {
  const fieldClass = `w-full rounded-md border border-[#dbeafe] bg-white px-3.5 py-3 text-[15px] text-[#172554] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#dbeafe] ${className}`;
  return <label className="grid gap-2 text-xs font-bold text-[#425148]"><span>{label}</span>{multiline ? <textarea className={fieldClass} rows={rows} value={props.value} onChange={props.onChange as ChangeEventHandler<HTMLTextAreaElement>} required={props.required} placeholder={props.placeholder} /> : <input className={fieldClass} type={props.type} inputMode={props.inputMode} value={props.value} onChange={props.onChange as ChangeEventHandler<HTMLInputElement>} required={props.required} placeholder={props.placeholder} {...inputProps} />}{helperText && <small className="font-normal text-[#6f7c75]">{helperText}</small>}</label>;
}

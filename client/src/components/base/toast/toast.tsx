"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  Notification,
  NotificationViewport,
  type NotificationAction,
  type NotificationAvatar,
  type NotificationPosition,
  type NotificationStatus,
} from "@/components/base/notification/notification";
import { cx } from "@/utils/cx";

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

export type ToastId = string | number;

export interface ToastOptions {
  id?: ToastId;
  description?: ReactNode;
  status?: NotificationStatus;
  icon?: IconComponent;
  avatar?: NotificationAvatar;
  actions?: NotificationAction[];
  duration?: number;
  dismissible?: boolean;
  onDismiss?: () => void;
}

interface ToastRecord extends ToastOptions {
  id: ToastId;
  title: ReactNode;
  dismissed: boolean;
}

let toasts: ToastRecord[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function show(title: ReactNode, options: ToastOptions = {}): ToastId {
  const id = options.id ?? nextId++;
  const record: ToastRecord = { ...options, id, title, dismissed: false };
  const existing = toasts.findIndex((item) => item.id === id);
  toasts = existing >= 0 ? toasts.map((item, index) => (index === existing ? record : item)) : [...toasts, record];
  emit();
  return id;
}

function remove(id: ToastId) {
  const record = toasts.find((item) => item.id === id);
  toasts = toasts.filter((item) => item.id !== id);
  emit();
  record?.onDismiss?.();
}

export function toast(title: ReactNode, options?: ToastOptions): ToastId {
  return show(title, options);
}

toast.success = (title: ReactNode, options?: Omit<ToastOptions, "status">) => show(title, { ...options, status: "success" });
toast.error = (title: ReactNode, options?: Omit<ToastOptions, "status">) => show(title, { ...options, status: "error" });
toast.info = (title: ReactNode, options?: Omit<ToastOptions, "status">) => show(title, { ...options, status: "information" });

toast.update = (id: ToastId, options: ToastOptions & { title?: ReactNode }) => {
  const current = toasts.find((item) => item.id === id && !item.dismissed);
  if (!current) return;
  const { title = current.title, ...rest } = options;
  show(title, { ...current, ...rest, id });
};

toast.dismiss = (id?: ToastId) => {
  toasts = toasts.map((item) => (id === undefined || item.id === id ? { ...item, dismissed: true } : item));
  emit();
};

let owners: string[] = [];
const ownerListeners = new Set<() => void>();

function subscribeOwners(listener: () => void) {
  ownerListeners.add(listener);
  return () => {
    ownerListeners.delete(listener);
  };
}

export interface ToasterProps {
  position?: NotificationPosition;
  limit?: number;
  duration?: number;
  "aria-label"?: string;
  closeLabel?: string;
  className?: string;
}

export function Toaster({
  position = "bottom-end",
  limit = 3,
  duration = 5000,
  "aria-label": ariaLabel = "Notifications",
  closeLabel,
  className,
}: ToasterProps) {
  const ownerId = useId();
  const items = useSyncExternalStore(subscribe, () => toasts, () => toasts);
  const isOwner = useSyncExternalStore(subscribeOwners, () => owners[0] === ownerId, () => false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    owners = [...owners, ownerId];
    ownerListeners.forEach((listener) => listener());
    return () => {
      owners = owners.filter((owner) => owner !== ownerId);
      ownerListeners.forEach((listener) => listener());
    };
  }, [ownerId]);

  useEffect(() => {
    if (!isOwner) return;
    const active = items.filter((item) => !item.dismissed);
    if (active.length > limit) {
      const overflow = new Set(active.slice(0, active.length - limit).map((item) => item.id));
      toasts = toasts.map((item) => (overflow.has(item.id) ? { ...item, dismissed: true } : item));
      emit();
    }
  }, [items, limit, isOwner]);

  const empty = items.length === 0;
  const [wasEmpty, setWasEmpty] = useState(empty);
  if (empty !== wasEmpty) {
    setWasEmpty(empty);
    if (empty) {
      setHovered(false);
      setFocused(false);
    }
  }

  if (!isOwner) return null;

  return (
    <NotificationViewport
      position={position}
      aria-label={ariaLabel}
      role="region"
      aria-live="polite"
      aria-relevant="additions text"
      className={cx("z-130", className)}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      {items.map((item) => {
        const timeout = item.duration ?? duration;
        return (
          <Notification
            key={`${item.id}:${timeout}`}
            title={item.title}
            description={item.description}
            status={item.status}
            icon={item.icon}
            avatar={item.avatar}
            dismissible={item.dismissible ?? true}
            closeLabel={closeLabel}
            actions={item.actions?.map((action) => ({
              ...action,
              onClick: () => {
                action.onClick?.();
                toast.dismiss(item.id);
              },
            }))}
            autoDismissDuration={Number.isFinite(timeout) && timeout > 0 ? timeout : undefined}
            paused={hovered || focused}
            dismissed={item.dismissed}
            introDelay={0}
            onDismiss={() => remove(item.id)}
          />
        );
      })}
    </NotificationViewport>
  );
}

"use client";

import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useId,
  useLayoutEffect,
  useState,
} from "react";
import type { ComponentType, ReactElement, ReactNode } from "react";
import {
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Heading as AriaHeading,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
  OverlayTriggerStateContext,
  Pressable,
} from "react-aria-components";
import type { DialogRenderProps, DialogTriggerProps, ModalOverlayProps } from "react-aria-components";
import { RiErrorWarningLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { SpinnerGlyph } from "@/components/base/spinner/spinner";
import { useDirection } from "@/components/foundations/direction/direction";
import { ScrollFade, useScrollFade } from "@/components/foundations/scroll-fade/scroll-fade";
import { cx, sortCx } from "@/utils/cx";

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

export type ModalSize = "sm" | "md" | "lg" | "xl";

const styles = sortCx({
  overlay: "group/modal fixed inset-x-0 top-0 z-100 flex h-(--visual-viewport-height) items-center justify-center p-4 sm:p-6",
  backdrop: [
    "absolute inset-0 bg-black/70",
    "transition-opacity duration-300 ease-out",
    "group-data-[entering]/modal:opacity-0 group-data-[exiting]/modal:opacity-0",
  ].join(" "),
  modal: [
    "relative flex max-h-full w-full flex-col outline-none",
    "transform-gpu transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
    "data-[entering]:opacity-0 data-[exiting]:opacity-0",
    "motion-safe:data-[entering]:scale-[0.85] motion-safe:data-[entering]:blur-[4px]",
    "motion-safe:data-[exiting]:scale-[0.85] motion-safe:data-[exiting]:blur-[4px]",
  ].join(" "),
  dialog: [
    "flex min-h-0 flex-col gap-2 overflow-clip py-4 outline-none",
    "rounded-3xl border border-separator-border bg-background-full shadow-xs",
  ].join(" "),
  size: {
    sm: "max-w-[400px]",
    md: "max-w-[480px]",
    lg: "max-w-[640px]",
    xl: "max-w-[800px]",
  },
  icon: {
    default: "bg-background-tertiary-default text-foreground-icon-secondary",
    danger: "bg-notification-error-background text-notification-error-foreground",
  },
});

interface ModalContextValue {
  descriptionId: string;
  setDescribed: (described: boolean) => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModalClose() {
  const state = useContext(OverlayTriggerStateContext);
  return () => state?.close();
}

export interface ModalTriggerProps extends Omit<DialogTriggerProps, "children"> {
  children: ReactNode;
}

export function ModalTrigger({ children, ...props }: ModalTriggerProps) {
  const [trigger, ...rest] = Children.toArray(children);
  return (
    <AriaDialogTrigger {...props}>
      {isValidElement(trigger) ? <Pressable>{trigger as ReactElement<Record<string, unknown>, string>}</Pressable> : trigger}
      {rest}
    </AriaDialogTrigger>
  );
}

export interface ModalProps extends Omit<ModalOverlayProps, "children" | "className" | "style"> {
  size?: ModalSize;
  role?: "dialog" | "alertdialog";
  "aria-label"?: string;
  className?: string;
  overlayClassName?: string;
  children: ReactNode | ((renderProps: DialogRenderProps) => ReactNode);
}

export function Modal({
  size = "md",
  role,
  "aria-label": ariaLabel,
  className,
  overlayClassName,
  isDismissable = true,
  children,
  ...props
}: ModalProps) {
  const direction = useDirection();

  return (
    <AriaModalOverlay {...props} dir={direction} isDismissable={isDismissable} className={cx(styles.overlay, overlayClassName)}>
      <div aria-hidden className={styles.backdrop} />
      <AriaModal className={cx(styles.modal, styles.size[size])}>
        <ModalDialog role={role} aria-label={ariaLabel} className={className}>
          {children}
        </ModalDialog>
      </AriaModal>
    </AriaModalOverlay>
  );
}

export interface ModalDialogProps {
  role?: "dialog" | "alertdialog";
  "aria-label"?: string;
  className?: string;
  children: ReactNode | ((renderProps: DialogRenderProps) => ReactNode);
}

export function ModalDialog({ role, "aria-label": ariaLabel, className, children }: ModalDialogProps) {
  const descriptionId = useId();
  const [described, setDescribed] = useState(false);

  return (
    <AriaDialog
      role={role}
      aria-label={ariaLabel}
      aria-describedby={described ? descriptionId : undefined}
      className={cx(styles.dialog, className)}
    >
      {(renderProps) => (
        <ModalContext.Provider value={{ descriptionId, setDescribed }}>
          {typeof children === "function" ? children(renderProps) : children}
        </ModalContext.Provider>
      )}
    </AriaDialog>
  );
}

export interface ModalHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: IconComponent;
  tone?: "default" | "danger";
  showCloseButton?: boolean;
  closeLabel?: string;
  className?: string;
  children?: ReactNode;
}

export function ModalHeader({
  title,
  description,
  icon: Icon,
  tone = "default",
  showCloseButton = true,
  closeLabel = "Close",
  className,
  children,
}: ModalHeaderProps) {
  const context = useContext(ModalContext);
  const close = useModalClose();
  const setDescribed = context?.setDescribed;
  const hasDescription = description != null && description !== false;

  useLayoutEffect(() => {
    if (!hasDescription || !setDescribed) return;
    setDescribed(true);
    return () => setDescribed(false);
  }, [hasDescription, setDescribed]);

  return (
    <div className={cx("flex shrink-0 items-start gap-3 px-4", className)}>
      <div className="flex min-w-0 flex-1 flex-col">
        {Icon ? (
          <span className={cx("mb-3 flex size-10 shrink-0 items-center justify-center rounded-full", styles.icon[tone])}>
            <Icon className="size-5" aria-hidden />
          </span>
        ) : null}
        <AriaHeading slot="title" className="py-1 text-body-medium text-text-primary">
          {title}
        </AriaHeading>
        {hasDescription ? (
          <p id={context?.descriptionId} className="text-body-regular text-text-secondary">
            {description}
          </p>
        ) : null}
        {children}
      </div>
      {showCloseButton ? (
        <CloseButton size="sm" aria-label={closeLabel} onClick={close} className="mt-0.5 -me-1 shrink-0" />
      ) : null}
    </div>
  );
}

export interface ModalBodyProps {
  className?: string;
  children: ReactNode;
}

export function ModalBody({ className, children }: ModalBodyProps) {
  const fade = useScrollFade();
  return (
    <div className="group/body relative flex min-h-0 flex-1 flex-col last:-mb-4">
      <div
        onScroll={fade.onScroll}
        className={cx(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-1 text-body-regular text-text-secondary group-last/body:pb-4",
          className,
        )}
      >
        {children}
      </div>
      <ScrollFade progress={fade.progress} surfaceClassName="from-background-full" />
    </div>
  );
}

export function ModalFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cx(
        "mt-2 flex shrink-0 flex-col-reverse gap-2 px-4 sm:flex-row sm:items-center sm:justify-end",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface AlertDialogProps
  extends Omit<ModalProps, "children" | "role" | "aria-label" | "isDismissable"> {
  title: ReactNode;
  description?: ReactNode;
  variant?: "danger" | "default";
  icon?: IconComponent | false;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  onConfirm?: () => void | Promise<unknown>;
  onCancel?: () => void;
  pendingLabel?: ReactNode;
  isConfirmDisabled?: boolean;
  isDismissable?: boolean;
  children?: ReactNode;
}

function PendingGlyph({ className }: { className?: string }) {
  return <SpinnerGlyph size="sm" className={cx(className, "text-current")} />;
}

export function AlertDialog({
  title,
  description,
  variant = "danger",
  icon = RiErrorWarningLine,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  pendingLabel,
  isConfirmDisabled = false,
  isDismissable = false,
  size = "sm",
  children,
  ...props
}: AlertDialogProps) {
  const [pending, setPending] = useState(false);

  return (
    <Modal {...props} size={size} role="alertdialog" isDismissable={isDismissable && !pending} isKeyboardDismissDisabled={pending}>
      {({ close }) => {
        const confirm = async () => {
          if (pending) return;
          const result = onConfirm?.();
          if (!result || typeof result.then !== "function") return close();
          setPending(true);
          try {
            await result;
            close();
          } catch {
          } finally {
            setPending(false);
          }
        };

        return (
          <>
            <ModalHeader
              title={title}
              description={description}
              icon={icon || undefined}
              tone={variant === "danger" ? "danger" : "default"}
              showCloseButton={false}
            />
            {children ? <ModalBody>{children}</ModalBody> : null}
            <ModalFooter>
              <Button
                variant="secondary"
                autoFocus
                disabled={pending}
                onClick={() => {
                  onCancel?.();
                  close();
                }}
              >
                {cancelLabel}
              </Button>
              <Button
                variant={variant === "danger" ? "danger" : "primary"}
                disabled={isConfirmDisabled}
                aria-busy={pending || undefined}
                leadingIcon={pending ? PendingGlyph : undefined}
                onClick={confirm}
              >
                {pending && pendingLabel ? pendingLabel : confirmLabel}
              </Button>
            </ModalFooter>
          </>
        );
      }}
    </Modal>
  );
}

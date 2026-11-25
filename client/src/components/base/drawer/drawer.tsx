"use client";

import type { ReactNode } from "react";
import { Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import type { DialogRenderProps, ModalOverlayProps } from "react-aria-components";
import {
  ModalBody,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalTrigger,
} from "@/components/base/modal/modal";
import { useDirection } from "@/components/foundations/direction/direction";
import { cx, sortCx } from "@/utils/cx";

export type DrawerPlacement = "start" | "end" | "top" | "bottom";
export type DrawerSize = "sm" | "md" | "lg";

const styles = sortCx({
  overlay: "group/drawer fixed inset-x-0 top-0 z-100 flex h-(--visual-viewport-height) p-2 sm:p-3",
  backdrop: [
    "absolute inset-0 bg-black/40",
    "transition-opacity duration-300 ease-out",
    "group-data-[entering]/drawer:opacity-0 group-data-[exiting]/drawer:opacity-0",
  ].join(" "),
  modal: [
    "relative flex w-full flex-col outline-none",
    "transform-gpu transition-[translate,filter,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
    "motion-safe:data-[entering]:blur-[4px] motion-safe:data-[exiting]:blur-[4px]",
    "motion-reduce:data-[entering]:opacity-0 motion-reduce:data-[exiting]:opacity-0",
  ].join(" "),
  dialog: "flex-1",
  placement: {
    end: {
      overlay: "justify-end",
      modal: [
        "h-full",
        "motion-safe:ltr:data-[entering]:translate-x-[calc(100%+24px)] motion-safe:ltr:data-[exiting]:translate-x-[calc(100%+24px)]",
        "motion-safe:rtl:data-[entering]:-translate-x-[calc(100%+24px)] motion-safe:rtl:data-[exiting]:-translate-x-[calc(100%+24px)]",
      ].join(" "),
    },
    start: {
      overlay: "justify-start",
      modal: [
        "h-full",
        "motion-safe:ltr:data-[entering]:-translate-x-[calc(100%+24px)] motion-safe:ltr:data-[exiting]:-translate-x-[calc(100%+24px)]",
        "motion-safe:rtl:data-[entering]:translate-x-[calc(100%+24px)] motion-safe:rtl:data-[exiting]:translate-x-[calc(100%+24px)]",
      ].join(" "),
    },
    bottom: {
      overlay: "items-end",
      modal: "max-h-[85%] motion-safe:data-[entering]:translate-y-[calc(100%+24px)] motion-safe:data-[exiting]:translate-y-[calc(100%+24px)]",
    },
    top: {
      overlay: "items-start",
      modal: "max-h-[85%] motion-safe:data-[entering]:-translate-y-[calc(100%+24px)] motion-safe:data-[exiting]:-translate-y-[calc(100%+24px)]",
    },
  },
  size: {
    sm: "max-w-[320px]",
    md: "max-w-[400px]",
    lg: "max-w-[600px]",
  },
});

export interface DrawerProps extends Omit<ModalOverlayProps, "children" | "className" | "style"> {
  placement?: DrawerPlacement;
  size?: DrawerSize;
  "aria-label"?: string;
  className?: string;
  overlayClassName?: string;
  children: ReactNode | ((renderProps: DialogRenderProps) => ReactNode);
}

export function Drawer({
  placement = "end",
  size = "md",
  "aria-label": ariaLabel,
  className,
  overlayClassName,
  isDismissable = true,
  children,
  ...props
}: DrawerProps) {
  const direction = useDirection();
  const edge = styles.placement[placement];
  const side = placement === "start" || placement === "end";

  return (
    <AriaModalOverlay
      {...props}
      dir={direction}
      isDismissable={isDismissable}
      className={cx(styles.overlay, edge.overlay, overlayClassName)}
    >
      <div aria-hidden className={styles.backdrop} />
      <AriaModal className={cx(styles.modal, edge.modal, side && styles.size[size])}>
        <ModalDialog aria-label={ariaLabel} className={cx(styles.dialog, className)}>
          {children}
        </ModalDialog>
      </AriaModal>
    </AriaModalOverlay>
  );
}

export {
  ModalBody as DrawerBody,
  ModalFooter as DrawerFooter,
  ModalHeader as DrawerHeader,
  ModalTrigger as DrawerTrigger,
};
export type {
  ModalBodyProps as DrawerBodyProps,
  ModalHeaderProps as DrawerHeaderProps,
  ModalTriggerProps as DrawerTriggerProps,
} from "@/components/base/modal/modal";

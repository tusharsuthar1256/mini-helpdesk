"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { RiMailCheckLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Divider } from "@/components/base/divider/divider";
import { Input } from "@/components/base/input/input";
import { InputOtp } from "@/components/base/input-otp/input-otp";
import { LinkButton } from "@/components/base/buttons/link-button";
import { SocialButton } from "@/components/base/social-button/social-button";
import { SOCIAL_PROVIDERS, type SocialProvider } from "@/components/base/social-button/social-providers";
import { useTemplateCopy } from "@/components/foundations/template-copy/template-copy";
import { cx } from "@/utils/cx";

export type AuthLayout = "stacked" | "inline" | "grid";
export type AuthMode = "signin" | "signup" | "verify";

export interface AuthCardProps {
  mode?: AuthMode;
  email?: string;
  codeLength?: number;
  onComplete?: (code: string) => void;
  onResend?: () => void;
  layout?: AuthLayout;
  providers?: SocialProvider[];
  title?: ReactNode;
  description?: ReactNode;
  media?: ReactNode;
  logo?: ReactNode;
  centered?: boolean;
  confirmPassword?: boolean;
  footnote?: ReactNode;
  onSubmit?: (data: FormData) => void;
  onProvider?: (provider: SocialProvider) => void;
  switchHref?: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  showSigninExtras?: boolean;
  className?: string;
}

const COPY = {
  signin: {
    title: "Welcome back",
    description: "Sign in to pick up where you left off.",
    cta: "Sign in",
    switchLead: "New here?",
    switchAction: "Create an account",
  },
  signup: {
    title: "Create your account",
    description: "Start building with BoardUI in a couple of minutes.",
    cta: "Create account",
    switchLead: "Already have an account?",
    switchAction: "Sign in",
  },
  verify: {
    title: "Check your inbox",
    description: "Enter the code we sent to finish signing in.",
    cta: "Verify and continue",
    switchLead: "Code not arriving?",
    switchAction: "Send a new one",
  },
} as const;

export function AuthCard({
  mode = "signin",
  email,
  codeLength = 6,
  onComplete,
  onResend,
  layout = "stacked",
  providers = ["google", "apple", "github"],
  title,
  description,
  media,
  logo,
  centered = false,
  confirmPassword = false,
  footnote,
  onSubmit,
  onProvider,
  switchHref = "#",
  headingLevel = 1,
  showSigninExtras = true,
  className,
}: AuthCardProps) {
  const localize = useTemplateCopy();
  const TitleHeading = `h${headingLevel}` as const;
  const [remember, setRemember] = useState(true);
  const [code, setCode] = useState("");
  const copy = COPY[mode];
  const signup = mode === "signup";
  const verify = mode === "verify";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.(new FormData(event.currentTarget));
  };

  const social = (
    <div
      className={cx(
        layout === "stacked" && "flex flex-col gap-2.5",
        layout === "inline" && "flex flex-wrap justify-center gap-2",
        layout === "grid" && "grid grid-flow-col auto-cols-fr gap-2.5",
      )}
    >
      {providers.map((provider) => (
        <SocialButton
          key={provider}
          brand={provider}
          appearance="white"
          iconOnly={layout !== "stacked"}
          fullWidth={layout === "stacked"}
          className={layout === "grid" ? "w-full" : undefined}
          aria-label={layout !== "stacked" ? `Continue with ${SOCIAL_PROVIDERS[provider].label}` : undefined}
          onClick={() => onProvider?.(provider)}
        >
          {`Continue with ${SOCIAL_PROVIDERS[provider].label}`}
        </SocialButton>
      ))}
    </div>
  );

  const centerContent = centered;
  const mark =
    logo ??
    (verify ? (
      <RiMailCheckLine className="size-8 text-foreground-icon-primary" aria-hidden />
    ) : null);

  const body = (
    <>
      {mark ? (
        <div className={cx("mb-5 flex", centerContent ? "justify-center" : "justify-start")}>
          {mark}
        </div>
      ) : null}

      <div className={cx("flex flex-col gap-1.5", centerContent && "text-center")}>
        <TitleHeading className="text-title-2-medium text-text-primary">
          {title ?? copy.title}
        </TitleHeading>
        <p className="text-body-regular text-text-secondary">
          {description ??
            (verify && email ? (
              <>
                Enter the code we sent to{" "}
                <span className="text-body-medium text-text-primary">{email}</span>{" "}
                to finish signing in.
              </>
            ) : (
              copy.description
            ))}
        </p>
      </div>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        {verify ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-body-medium text-text-secondary">
              Verification code
            </span>
            <InputOtp
              value={code}
              onChange={setCode}
              onComplete={onComplete}
              length={codeLength}
              groupEvery={codeLength % 2 === 0 ? codeLength / 2 : undefined}
              aria-label="Verification code"
              className="justify-start"
            />
          </div>
        ) : null}

        {signup ? (
          <Input name="name" label="Full name" placeholder="Ada Lovelace" isRequired />
        ) : null}

        {verify ? null : (
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="you@company.com"
          autoComplete="email"
          hint={signup ? "We use this to contact you, and never share it." : undefined}
          isRequired
        />
        )}

        {verify ? null : signup && confirmPassword ? (
          <>
            <Input
              name="password"
              type="password"
              label="Password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              isRequired
            />
            <Input
              name="confirmPassword"
              type="password"
              label="Confirm password"
              placeholder="Repeat your password"
              autoComplete="new-password"
              isRequired
            />
          </>
        ) : (
          <Input
            name="password"
            type="password"
            label="Password"
            placeholder={signup ? "At least 8 characters" : "Enter your password"}
            autoComplete={signup ? "new-password" : "current-password"}
            isRequired
          />
        )}

        {signup || verify || !showSigninExtras ? null : (
          <div className="flex items-center justify-between">
            <Checkbox size="sm" isSelected={remember} onChange={setRemember}>
              Remember me
            </Checkbox>
            <LinkButton href="#">Forgot password?</LinkButton>
          </div>
        )}

        <Button type="submit" className="w-full">
          {copy.cta}
        </Button>

        {signup && !footnote ? (
          <p className="text-caption-1-regular text-text-tertiary">
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </p>
        ) : null}
      </form>

      {!verify && providers.length > 0 ? (
        <>
          <div className="my-5">
            <Divider>or continue with</Divider>
          </div>
          {social}
        </>
      ) : null}

      {verify ? (
        <p className="mt-6 text-center text-body-regular text-text-secondary">
          {copy.switchLead}{" "}
          <LinkButton onClick={onResend}>{copy.switchAction}</LinkButton>
        </p>
      ) : (
        <p className="mt-6 text-center text-body-regular text-text-secondary">
          {copy.switchLead} <LinkButton href={switchHref}>{copy.switchAction}</LinkButton>
        </p>
      )}
    </>
  );

  const card = media ? (
    <div
      className={cx(
        "grid w-full max-w-[880px] overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default shadow-xs md:grid-cols-2 dark:bg-background-secondary-default",
        className,
      )}
    >
      <div className="flex flex-col p-6 sm:p-8">{body}</div>
      <div className="relative hidden bg-background-secondary-default md:block">{media}</div>
    </div>
  ) : (
    <div
      className={cx(
        "flex w-full max-w-[400px] flex-col rounded-3xl border border-border-button-default bg-background-primary-default p-6 shadow-xs sm:p-8 dark:bg-background-secondary-default",
        className,
      )}
    >
      {body}
    </div>
  );

  if (!footnote) return localize(card);

  return localize(
    <div className="flex w-full flex-col items-center gap-4">
      {card}
      <p className="max-w-[520px] text-center text-caption-1-regular text-text-tertiary">
        {footnote}
      </p>
    </div>
  );
}

"use client";

import { forwardRef, type AnchorHTMLAttributes, type MouseEvent } from "react";
import { useTransitionRouter } from "./TransitionProvider";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  external?: boolean;
};

/** Anchor with shared black page-transition. `external` opts out (new tab). */
const TransitionLink = forwardRef<HTMLAnchorElement, Props>(function TransitionLink(
  { href, external, onClick, ...rest },
  ref
) {
  const { navigate } = useTransitionRouter();

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (external) return;
    navigate(href, e);
  };

  if (external) {
    return (
      <a ref={ref} href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} {...rest} />
    );
  }
  return <a ref={ref} href={href} onClick={handle} {...rest} />;
});

export default TransitionLink;

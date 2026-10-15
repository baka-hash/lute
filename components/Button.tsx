import type { Ref } from "react";
import { ArrowSwap } from "./icons";

const INK = "#132F40";
const WHITE = "white";

/* Figma Button component (40:2246): Light Primary, Dark Secondary (glass, no tile), Dark Primary */
const VARIANTS = {
  primary: { className: "btn btn-primary", arrow: { from: INK, to: WHITE } },
  secondary: { className: "btn btn-secondary", arrow: null },
  dark: { className: "btn-dark", arrow: { from: WHITE, to: INK } },
} as const;

type Props = {
  variant: keyof typeof VARIANTS;
  href: string;
  children: string;
  className?: string;
  id?: string;
  ref?: Ref<HTMLAnchorElement>;
};

export default function Button({ variant, href, children, className, id, ref }: Props) {
  const v = VARIANTS[variant];
  return (
    <a ref={ref} id={id} className={className ? `${v.className} ${className}` : v.className} href={href}>
      <span className="label">
        <span className="lbl">
          <span className="a">{children}</span>
          <span className="b" aria-hidden="true">{children}</span>
        </span>
      </span>
      {v.arrow && (
        <span className="tile" aria-hidden="true">
          <ArrowSwap from={v.arrow.from} to={v.arrow.to} />
        </span>
      )}
    </a>
  );
}

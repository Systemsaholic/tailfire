"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";

import { cn } from "../lib/utils";

interface NavLinkProps extends Omit<LinkProps, "href"> {
  href: LinkProps["href"];
  className?: string;
  activeClassName?: string;
  children?: React.ReactNode;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, activeClassName, href, children, ...props }, ref) => {
    const pathname = usePathname();
    const hrefValue =
      typeof href === "string"
        ? href
        : typeof href.pathname === "string"
          ? href.pathname
          : "/";

    const normalizedHref = hrefValue?.split("#")[0] || "/";
    const isAnchorLink = typeof href === "string" && href.includes("#");
    const isActive = !isAnchorLink && pathname === normalizedHref;

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(className, isActive && activeClassName)}
        {...props}
      >
        {children}
      </Link>
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
export type { NavLinkProps };

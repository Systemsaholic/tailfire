"use client";

import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import type { StaticImageData } from "next/image";
import { NavLink } from "@tailfire/ui-public";
import phoenixLogoImport from "@/assets/phoenix-logo.svg";
import { ClientPortalBadge } from "@/components/ClientPortalBadge";
import { ConsultantBadge } from "@/components/ConsultantBadge";

const phoenixLogo = phoenixLogoImport as StaticImageData;

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  // On homepage, use anchors for smooth scrolling; elsewhere, link to /search
  const destinationsHref = isHomePage ? "/#destinations" : "/search";
  const packagesHref = isHomePage ? "/#packages" : "/search";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-secondary/90 backdrop-blur-xl shadow-2xl border-b border-primary/15">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-24">
          <NavLink href="/" className="flex items-center space-x-3 group" aria-label="Phoenix Voyages home">
            <Image
              src={phoenixLogo}
              alt="Phoenix Voyages Logo"
              className="h-16 w-auto transition-transform duration-300 group-hover:scale-110"
              width={160}
              height={64}
              priority
            />
            <span className="text-2xl font-display font-bold tracking-wide text-primary transition-colors group-hover:text-primary/80">
              Phoenix Voyages
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLink
              href="/"
              className="text-secondary-foreground hover:text-primary transition-all duration-300 font-medium tracking-wide uppercase text-sm relative after:content-[''] after:absolute after:w-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
              activeClassName="text-primary"
            >
              Home
            </NavLink>
            <NavLink
              href={destinationsHref}
              className="text-secondary-foreground hover:text-primary transition-all duration-300 font-medium tracking-wide uppercase text-sm relative after:content-[''] after:absolute after:w-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
              activeClassName="text-primary"
            >
              Destinations
            </NavLink>
            <NavLink
              href={packagesHref}
              className="text-secondary-foreground hover:text-primary transition-all duration-300 font-medium tracking-wide uppercase text-sm relative after:content-[''] after:w-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
              activeClassName="text-primary"
            >
              Travel Packages
            </NavLink>
            <NavLink
              href="/about"
              className="text-secondary-foreground hover:text-primary transition-all duration-300 font-medium tracking-wide uppercase text-sm relative after:content-[''] after:w-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
              activeClassName="text-primary"
            >
              About Us
            </NavLink>
            <NavLink
              href="/contact"
              className="text-secondary-foreground hover:text-primary transition-all duration-300 font-medium tracking-wide uppercase text-sm relative after:content-[''] after:absolute after:w-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
              activeClassName="text-primary"
            >
              Contact
            </NavLink>
            <NavLink
              href="/advisors"
              className="text-secondary-foreground hover:text-primary transition-all duration-300 font-medium tracking-wide uppercase text-sm relative after:content-[''] after:absolute after:w-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
              activeClassName="text-primary"
            >
              Our Advisors
            </NavLink>
            <ClientPortalBadge variant="nav" />
            <ConsultantBadge variant="nav" />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-secondary-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-4">
            <ClientPortalBadge variant="card" />
            <ConsultantBadge variant="card" />
            <NavLink
              href="/"
              className="block text-secondary-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              Home
            </NavLink>
            <NavLink
              href={destinationsHref}
              className="block text-secondary-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              Destinations
            </NavLink>
            <NavLink
              href={packagesHref}
              className="block text-secondary-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              Travel Packages
            </NavLink>
            <NavLink
              href="/about"
              className="block text-secondary-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              About Us
            </NavLink>
            <NavLink
              href="/contact"
              className="block text-secondary-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </NavLink>
            <NavLink
              href="/advisors"
              className="block text-secondary-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              Our Advisors
            </NavLink>
          </div>
        )}
      </div>
    </nav>
  );
};

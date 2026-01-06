"use client";

import Image from "next/image";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";

import phoenixLogo from "../assets/phoenix-logo.svg";
import { NavLink } from "./NavLink";

export const Footer = ({ id }: { id?: string }) => {
  return (
    <footer id={id} className="bg-secondary text-secondary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary to-secondary/90" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <Image
              src={phoenixLogo}
              alt="Phoenix Voyages Logo"
              className="h-16 w-auto mb-6"
              width={160}
              height={64}
              priority
            />
            <p className="text-secondary-foreground/80 mb-6 font-light leading-relaxed">
              Your trusted partner in creating extraordinary travel experiences around the world.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/phoenixvoyages"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-secondary-foreground/80 hover:bg-primary hover:text-secondary transition-all duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://www.instagram.com/phoenixvoyages"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-secondary-foreground/80 hover:bg-primary hover:text-secondary transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.linkedin.com/company/phoenix-voyages"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-secondary-foreground/80 hover:bg-primary hover:text-secondary transition-all duration-300 hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-display font-semibold mb-6 tracking-wider uppercase text-primary">
              Quick Links
            </h4>
            <ul className="space-y-3">
              <li>
                <NavLink href="/" className="text-secondary-foreground/80 hover:text-primary transition-colors duration-300 font-light">
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink href="/about" className="text-secondary-foreground/80 hover:text-primary transition-colors duration-300 font-light">
                  About Us
                </NavLink>
              </li>
              <li>
                <NavLink href="/contact" className="text-secondary-foreground/80 hover:text-primary transition-colors duration-300 font-light">
                  Contact
                </NavLink>
              </li>
              <li>
                <NavLink href="/search" className="text-secondary-foreground/80 hover:text-primary transition-colors duration-300 font-light">
                  Travel Packages
                </NavLink>
              </li>
              <li>
                <NavLink href="/advisors" className="text-secondary-foreground/80 hover:text-primary transition-colors duration-300 font-light">
                  Our Advisors
                </NavLink>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-display font-semibold mb-6 tracking-wider uppercase text-primary">
              Our Services
            </h4>
            <ul className="space-y-3 text-secondary-foreground/80 font-light">
              <li>Flight Booking</li>
              <li>Hotel Reservations</li>
              <li>Tour Packages</li>
              <li>Travel Insurance</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-display font-semibold mb-6 tracking-wider uppercase text-primary">
              Contact Us
            </h4>
            <ul className="space-y-4 text-sm text-secondary-foreground/80">
              <li className="flex items-start space-x-3">
                <MapPin size={20} className="text-primary flex-shrink-0 mt-1" />
                <span className="font-light">600 du Golf Rd. Hammond ON K0A 2A0</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={20} className="text-primary flex-shrink-0" />
                <a href="tel:+18553835771" className="font-light hover:text-primary">
                  +1 855-383-5771
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={20} className="text-primary flex-shrink-0" />
                <a
                  href="mailto:info@phoenixvoyages.ca"
                  className="font-light hover:text-primary"
                  suppressHydrationWarning
                >
                  info@phoenixvoyages.ca
                </a>
              </li>
              <li className="text-xs uppercase tracking-wide text-muted-foreground">
                TICO: 50028032
              </li>
            </ul>
          </div>
        </div>
        <div className="grid gap-4 border-t border-primary/20 pt-8 md:grid-cols-3">
          <div>
            <h5 className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Legal</h5>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li>
                <NavLink href="/terms" className="hover:text-primary">
                  Terms &amp; Conditions
                </NavLink>
              </li>
              <li>
                <NavLink href="/privacy" className="hover:text-primary">
                  Privacy Policy
                </NavLink>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Social</h5>
            <ul className="flex items-center gap-3 text-muted-foreground">
              <li>
                <a
                  href="https://www.facebook.com/phoenixvoyages"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary"
                >
                  <Facebook size={20} />
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/phoenixvoyages"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary"
                >
                  <Instagram size={20} />
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/company/phoenix-voyages"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary"
                >
                  <Linkedin size={20} />
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-right text-sm text-secondary-foreground/60">
              © 2025 Phoenix Voyages. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

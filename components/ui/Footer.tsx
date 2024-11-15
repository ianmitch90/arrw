'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Button, Divider } from '@nextui-org/react';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';

interface FooterProps {
  className?: string;
}

const socialLinks = [
  { icon: 'ri:twitter-x-fill', href: '#', label: 'Twitter' },
  { icon: 'mdi:instagram', href: '#', label: 'Instagram' },
  { icon: 'mdi:facebook', href: '#', label: 'Facebook' },
  { icon: 'mdi:youtube', href: '#', label: 'YouTube' },
];

const footerLinks = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Updates', href: '/updates' },
      { label: 'Beta Program', href: '/beta' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Tutorials', href: '/tutorials' },
      { label: 'Blog', href: '/blog' },
      { label: 'Support', href: '/support' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press Kit', href: '/press' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Licenses', href: '/licenses' },
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

export default function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'w-full bg-background/60 backdrop-blur-xl backdrop-saturate-150 border-t border-default-200/50',
        className
      )}
    >
      <motion.div
        className="mx-auto w-full max-w-7xl px-6 py-12 md:py-16 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {/* Main footer content */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {footerLinks.map((group) => (
            <motion.div key={group.title} variants={itemVariants}>
              <h3 className="text-sm font-semibold text-foreground">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-default-500 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <Divider className="my-8" />

        {/* Bottom section */}
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <motion.p
            variants={itemVariants}
            className="text-sm text-default-500"
          >
            &copy; {currentYear} ARRW. All rights reserved.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex items-center gap-4"
          >
            {socialLinks.map((social) => (
              <Button
                key={social.label}
                as={Link}
                href={social.href}
                size="sm"
                isIconOnly
                variant="light"
                aria-label={social.label}
                className="text-default-500 hover:text-foreground"
              >
                <Icon icon={social.icon} className="text-lg" />
              </Button>
            ))}
          </motion.div>
        </div>

        {/* Newsletter subscription */}
        <motion.div
          variants={itemVariants}
          className="mt-8 rounded-2xl bg-default-50/50 p-6 backdrop-blur-xl backdrop-saturate-150"
        >
          <h3 className="text-sm font-semibold text-foreground">
            Subscribe to our newsletter
          </h3>
          <p className="mt-2 text-sm text-default-500">
            Get the latest updates and news delivered to your inbox.
          </p>
          <form className="mt-4 flex gap-2 sm:max-w-md">
            <input
              type="email"
              required
              className="min-w-0 flex-auto rounded-lg border border-default-200/50 bg-background/60 px-3.5 py-2 text-sm text-foreground shadow-sm backdrop-blur-xl backdrop-saturate-150 placeholder:text-default-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Enter your email"
            />
            <Button
              type="submit"
              color="primary"
              className="flex-none"
            >
              Subscribe
            </Button>
          </form>
        </motion.div>
      </motion.div>
    </footer>
  );
}

'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@/components/contexts/UserContext'
import { useToast } from '@/components/ui/toast'
import {
  Button,
  Avatar,
  Navbar,
  NavbarContent,
  NavbarBrand,
  NavbarMenuToggle,
  NavbarItem,
  Link,
  NavbarMenu,
  NavbarMenuItem,
  NavbarProps,
  Switch,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  User
} from '@heroui/react'
import { Logo } from '../icons/Logo'
import { Icon } from '@iconify/react'
import { m } from 'framer-motion'

interface MenuItem {
  label: string
  href: string
  icon?: string
  isExternal?: boolean
}

interface TopNavProps extends Omit<NavbarProps, 'children'> {
  showDarkModeSwitch?: boolean
  showAuthButtons?: boolean
  logoText?: string
}

const menuItems: MenuItem[] = [
  { label: 'Home', href: '/', icon: 'solar:home-2-bold' },
  { label: 'Features', href: '/features', icon: 'solar:star-bold' },
  { label: 'Customers', href: '/customers', icon: 'solar:users-group-rounded-bold' },
  { label: 'About', href: '/about', icon: 'solar:info-circle-bold' },
  { label: 'Blog', href: '/blog', icon: 'solar:document-text-bold' },
  { label: 'Pricing', href: '/pricing', icon: 'solar:tag-price-bold' },
  { label: 'Documentation', href: '/docs', icon: 'solar:book-bold', isExternal: true },
  { label: 'Contact', href: '/contact', icon: 'solar:chat-round-dots-bold' }
]

const userMenuItems: MenuItem[] = [
  { label: 'Profile', href: '/profile', icon: 'solar:user-circle-bold' },
  { label: 'Settings', href: '/settings', icon: 'solar:settings-bold' },
  { label: 'Billing', href: '/billing', icon: 'solar:card-bold' },
  { label: 'Help', href: '/help', icon: 'solar:chat-square-help-bold' },
  { label: 'Sign Out', href: '/signout', icon: 'solar:logout-3-bold' }
]

export default function TopNav({ 
  showDarkModeSwitch = true,
  showAuthButtons = true,
  logoText = 'ARRW',
  ...props 
}: TopNavProps) {
  const { user, signOut } = useUser()
  const { toast } = useToast()
  const [isDark, setIsDark] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleDarkMode = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark', !isDark)
    
    toast({
      type: 'info',
      title: !isDark ? 'Dark Mode Enabled' : 'Light Mode Enabled',
      description: 'Your preference has been saved.',
      duration: 2000
    })
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        type: 'success',
        title: 'Signed Out',
        description: 'You have been successfully signed out.'
      })
    } catch (error) {
      toast({
        type: 'error',
        title: 'Sign Out Failed',
        description: 'Please try again later.'
      })
    }
  }

  return (
    <Navbar
      {...props}
      className={`transition-all duration-200 ${
        isScrolled 
          ? 'py-2 shadow-medium bg-background/80' 
          : 'py-4 bg-transparent'
      }`}
      classNames={{
        wrapper: 'px-4 max-w-7xl mx-auto',
        item: 'hidden md:flex'
      }}
      height="auto"
      isBordered={isScrolled}
    >
      <NavbarContent className="gap-4" justify="start">
        <NavbarMenuToggle className="md:hidden" />
        
        <NavbarBrand as={Link} href="/" className="gap-2 max-w-fit">
          <m.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="rounded-full bg-foreground text-background p-1"
          >
            <Logo size={32} />
          </m.div>
          <p className="font-semibold text-inherit">{logoText}</p>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden md:flex gap-4" justify="center">
        {menuItems.slice(0, 5).map((item) => (
          <NavbarItem key={item.label}>
            <Link 
              href={item.href}
              size="sm"
              className="text-default-600 flex items-center gap-1"
              isExternal={item.isExternal}
            >
              {item.icon && (
                <Icon icon={item.icon} className="text-lg" />
              )}
              {item.label}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent justify="end" className="gap-2">
        {showDarkModeSwitch && (
          <NavbarItem>
            <Switch
              defaultSelected={isDark}
              onChange={toggleDarkMode}
              size="sm"
              color="success"
              startContent={<Icon icon="solar:sun-bold" />}
              endContent={<Icon icon="solar:moon-bold" />}
              className="ml-2"
            />
          </NavbarItem>
        )}

        {showAuthButtons && (
          <>
            {user ? (
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Avatar
                    as="button"
                    className="transition-transform"
                    color="primary"
                    name={user.name}
                    size="sm"
                    src={user.avatar}
                  />
                </DropdownTrigger>
                <DropdownMenu 
                  aria-label="User menu actions" 
                  variant="flat"
                  onAction={(key) => {
                    if (key === 'signout') handleSignOut()
                  }}
                >
                  <DropdownItem key="profile" className="h-14 gap-2">
                    <User
                      name={user.name}
                      description={user.email}
                      avatarProps={{
                        src: user.avatar,
                        size: "sm"
                      }}
                    />
                  </DropdownItem>
                  {userMenuItems.map((item) => (
                    <DropdownItem
                      key={item.label.toLowerCase()}
                      href={item.href}
                      startContent={
                        <Icon icon={item.icon!} className="text-xl" />
                      }
                    >
                      {item.label}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            ) : (
              <>
                <NavbarItem>
                  <Button 
                    as={Link} 
                    href="/login" 
                    variant="light"
                    size="sm"
                  >
                    Login
                  </Button>
                </NavbarItem>
                <NavbarItem>
                  <Button
                    as={Link}
                    href="/signup"
                    color="primary"
                    size="sm"
                    className="font-medium"
                  >
                    Sign Up
                  </Button>
                </NavbarItem>
              </>
            )}
          </>
        )}
      </NavbarContent>

      <NavbarMenu>
        {menuItems.map((item) => (
          <NavbarMenuItem key={item.label}>
            <Link
              href={item.href}
              size="lg"
              className="w-full text-default-600 flex items-center gap-2"
              isExternal={item.isExternal}
            >
              {item.icon && (
                <Icon icon={item.icon} className="text-xl" />
              )}
              {item.label}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  )
}

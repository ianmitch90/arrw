'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import useMeasure from 'react-use-measure'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import { cn } from '@/utils/cn'
import { useClickOutside } from '@/hooks/useClickOutside'
import { Icon } from '@iconify/react'
import {
  Button,
  Avatar,
  Card,
  CardBody,
  Badge,
  Link,
  Progress
} from '@nextui-org/react'
import { useUser } from '@/components/contexts/UserContext'

const transition = {
  type: 'spring',
  bounce: 0.15,
  duration: 0.5
}

interface NavItem {
  id: string
  label: string
  icon: string
  href: string
  content?: React.ReactNode
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  // Map is the default view
  {
    id: 'map',
    label: 'Map',
    icon: 'solar:map-bold',
    href: '/map'
  },
  // Messages opens the chat
  {
    id: 'messages',
    label: 'Messages',
    icon: 'solar:chat-round-dots-bold',
    href: '/map?chat=messages'
  },
  // Global chat opens the chat
  {
    id: 'global',
    label: 'Global',
    icon: 'solar:users-group-rounded-bold',
    href: '/map?chat=global'
  },
  {
    id: 'home',
    label: 'Home',
    icon: 'solar:home-2-bold',
    href: '/',
    content: (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon icon="solar:home-2-bold" className="text-2xl text-primary" />
          </div>
          <div>
            <p className="font-medium">Welcome Back!</p>
            <p className="text-sm text-default-500">Discover what&apos;s new today</p>
          </div>
        </div>
        <Progress
          size="sm"
          radius="full"
          classNames={{
            base: "max-w-md",
            track: "drop-shadow-md border border-default",
            indicator: "bg-gradient-to-r from-pink-500 to-yellow-500",
            label: "tracking-wider font-medium text-default-600",
            value: "text-foreground/60"
          }}
          label="Daily Progress"
          value={70}
          showValueLabel={true}
        />
      </div>
    )
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: 'solar:chat-round-dots-bold',
    href: '/messages',
    badge: 3,
    content: (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="font-medium">Recent Messages</p>
          <Button 
            size="sm" 
            variant="flat" 
            color="primary"
            as={Link}
            href="/messages"
          >
            View All
          </Button>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} shadow="none" className="border border-default-200">
              <CardBody className="gap-2.5 p-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    size="sm"
                    src={`https://i.pravatar.cc/150?u=${i}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">John Doe</p>
                    <p className="text-xs text-default-500 truncate">
                      Hey, I just wanted to check in...
                    </p>
                  </div>
                  <span className="text-tiny text-default-400">2m ago</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'explore',
    label: 'Explore',
    icon: 'solar:discovery-bold',
    href: '/explore',
    content: (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="font-medium">Trending Now</p>
          <Button 
            size="sm" 
            variant="flat" 
            color="primary"
            as={Link}
            href="/explore"
          >
            See More
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card 
              key={i} 
              shadow="none" 
              className="border border-default-200"
              isPressable
            >
              <CardBody className="p-3">
                <div className="aspect-square rounded-lg bg-default-100" />
                <p className="mt-2 font-medium truncate">Trending Item {i}</p>
                <p className="text-tiny text-default-500">1.2k views</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: 'solar:user-circle-bold',
    href: '/profile',
    content: (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar
            size="lg"
            src="https://i.pravatar.cc/150?u=profile"
            className="ring-2 ring-primary"
          />
          <div>
            <p className="font-medium">John Doe</p>
            <p className="text-sm text-default-500">@johndoe</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-3 rounded-lg bg-default-100">
            <p className="font-semibold">128</p>
            <p className="text-tiny text-default-500">Posts</p>
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-default-100">
            <p className="font-semibold">12.8k</p>
            <p className="text-tiny text-default-500">Followers</p>
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-default-100">
            <p className="font-semibold">1.2k</p>
            <p className="text-tiny text-default-500">Following</p>
          </div>
        </div>
        <Button 
          size="sm" 
          variant="flat" 
          color="primary"
          as={Link}
          href="/profile/edit"
          startContent={<Icon icon="solar:pen-bold" />}
        >
          Edit Profile
        </Button>
      </div>
    )
  }
]

interface BottomNavProps {
  className?: string
  showLabels?: boolean
}

export default function BottomNav({ 
  className,
  showLabels = false 
}: BottomNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()
  const [active, setActive] = useState<string | null>(null)
  const [contentRef, { height: contentHeight }] = useMeasure()
  const [menuRef, { width: containerWidth }] = useMeasure()
  const ref = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [maxWidth, setMaxWidth] = useState(0)

  useClickOutside(ref, () => {
    setIsOpen(false)
    setActive(null)
  })

  useEffect(() => {
    if (!containerWidth || maxWidth > 0) return
    setMaxWidth(containerWidth)
  }, [containerWidth, maxWidth])

  // Close panel when route changes
  useEffect(() => {
    setIsOpen(false)
    setActive(null)
  }, [pathname])

  return (
    <MotionConfig transition={transition}>
      <motion.div
        className={cn(
          "fixed bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4",
          className
        )}
        ref={ref}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
      >
        <motion.div 
          className={cn(
            "h-full w-full rounded-2xl border border-default-200/50 bg-background/80 shadow-xl backdrop-blur-lg backdrop-saturate-150",
            isOpen && "rounded-b-none"
          )}
          layout
        >
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                key="content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: contentHeight || 0, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
                style={{ width: maxWidth }}
              >
                <div ref={contentRef} className="p-4">
                  <AnimatePresence mode="wait">
                    {NAV_ITEMS.map((item) => {
                      const isSelected = active === item.id

                      if (!isSelected) return null

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                        >
                          {item.content}
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className="flex items-center justify-around p-2"
            ref={menuRef}
          >
            {NAV_ITEMS.map((item) => {
              const isSelected = active === item.id || pathname === item.href
              
              return (
                <Button
                  key={item.id}
                  aria-label={item.label}
                  size="sm"
                  variant="light"
                  className={cn(
                    "flex-col gap-1 h-auto min-w-[64px] px-2 py-1.5",
                    isSelected && "text-primary"
                  )}
                  onClick={() => {
                    if (item.content) {
                      if (!isOpen) setIsOpen(true)
                      if (active === item.id) {
                        setIsOpen(false)
                        setActive(null)
                        return
                      }
                      setActive(item.id)
                    } else {
                      router.push(item.href)
                    }
                  }}
                >
                  <div className="relative">
                    <Icon 
                      icon={item.icon} 
                      className={cn(
                        "text-xl transition-transform",
                        isSelected && "scale-110"
                      )}
                    />
                    {item.badge && (
                      <Badge
                        content={item.badge}
                        size="sm"
                        color="danger"
                        className="absolute -top-1 -right-1"
                      />
                    )}
                  </div>
                  {showLabels && (
                    <span className="text-tiny">{item.label}</span>
                  )}
                </Button>
              )
            })}
          </div>
        </motion.div>
      </motion.div>
    </MotionConfig>
  )
}

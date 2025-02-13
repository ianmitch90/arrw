import { useState } from 'react';
import { Tab, Tabs } from '@heroui/react';
import { Users, UsersRound, MapPin } from 'lucide-react';

export type TabKey = 'users' | 'groups' | 'places';

interface TabBarProps {
  activeTab: TabKey;
  onTabChange: (key: TabKey) => void;
  userCount?: number;
  groupCount?: number;
  placeCount?: number;
}

export function TabBar({
  activeTab,
  onTabChange,
  userCount = 0,
  groupCount = 0,
  placeCount = 0
}: TabBarProps) {
  const tabs = [
    {
      key: 'users',
      label: 'Users',
      icon: Users,
      count: userCount
    },
    {
      key: 'groups',
      label: 'Groups',
      icon: UsersRound,
      count: groupCount
    },
    {
      key: 'places',
      label: 'Places',
      icon: MapPin,
      count: placeCount
    }
  ] as const;

  return (
    <div className="px-2 border-b">
      <Tabs 
        selectedKey={activeTab}
        onSelectionChange={(key) => onTabChange(key as TabKey)}
        variant="underlined"
        classNames={{
          tabList: "gap-6",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-2 h-12",
          tabContent: "group-data-[selected=true]:text-primary"
        }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.key}
            title={
              <div className="flex items-center gap-2">
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="text-xs text-default-500">
                    {tab.count}
                  </span>
                )}
              </div>
            }
          />
        ))}
      </Tabs>
    </div>
  );
}

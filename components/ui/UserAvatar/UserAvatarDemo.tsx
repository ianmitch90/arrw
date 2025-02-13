"use client";

import { UserAvatar } from './UserAvatar';

export function UserAvatarDemo() {
  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Basic Usage */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Basic Avatar</h3>
        <div className="flex gap-4 items-center">
          <UserAvatar userId="example-user-1" size="sm" />
          <UserAvatar userId="example-user-1" size="md" />
          <UserAvatar userId="example-user-1" size="lg" />
        </div>
      </section>

      {/* With Presence */}
      <section>
        <h3 className="text-lg font-semibold mb-4">With Presence Indicator</h3>
        <div className="flex gap-4 items-center">
          <UserAvatar userId="example-user-2" showPresence />
          <UserAvatar 
            userId="example-user-2" 
            showPresence 
            className="ring-2 ring-primary ring-offset-2"
          />
        </div>
      </section>

      {/* With Verification */}
      <section>
        <h3 className="text-lg font-semibold mb-4">With Verification Badge</h3>
        <div className="flex gap-4 items-center">
          <UserAvatar userId="example-user-3" showVerification />
          <UserAvatar 
            userId="example-user-3" 
            showVerification 
            showPresence 
          />
        </div>
      </section>

      {/* With Status */}
      <section>
        <h3 className="text-lg font-semibold mb-4">With Status Indicator</h3>
        <div className="flex gap-4 items-center">
          <UserAvatar userId="example-user-4" showStatus />
          <UserAvatar 
            userId="example-user-4" 
            showStatus 
            showVerification 
          />
        </div>
      </section>

      {/* In Chat Context */}
      <section>
        <h3 className="text-lg font-semibold mb-4">In Chat</h3>
        <div className="flex flex-col gap-4 max-w-md">
          <div className="flex items-start gap-2">
            <UserAvatar 
              userId="example-user-5" 
              size="sm"
              showPresence 
              showVerification
            />
            <div className="bg-default-100 rounded-lg p-3">
              Hello! How are you?
            </div>
          </div>
          <div className="flex items-start gap-2 self-end">
            <div className="bg-primary rounded-lg p-3 text-white">
              I'm doing great, thanks!
            </div>
            <UserAvatar 
              userId="current-user" 
              size="sm"
              showPresence 
            />
          </div>
        </div>
      </section>

      {/* In Map Context */}
      <section>
        <h3 className="text-lg font-semibold mb-4">On Map</h3>
        <div className="relative w-64 h-64 bg-gray-100 rounded-xl">
          <div className="absolute top-1/4 left-1/3">
            <UserAvatar 
              userId="example-user-6" 
              size="sm"
              showPresence
              className="ring-2 ring-white"
            />
          </div>
          <div className="absolute bottom-1/3 right-1/4">
            <UserAvatar 
              userId="example-user-7" 
              size="sm"
              showPresence
              showVerification
              className="ring-2 ring-white"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

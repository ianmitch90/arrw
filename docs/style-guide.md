# UI Style Guide

## Component Usage Guidelines

### Core Components

#### Buttons
```tsx
// Primary actions
<Button color="primary">Primary Action</Button>

// Secondary actions
<Button variant="bordered">Secondary Action</Button>

// Danger actions
<Button color="danger">Delete</Button>

// Loading states
<Button isLoading loadingText="Processing...">Submit</Button>
```

#### Forms
```tsx
// Input fields
<Input
  label="Field Label"
  placeholder="Enter value"
  errorMessage={error}
  isInvalid={!!error}
  description="Helper text"
/>

// Form layout
<form className="space-y-4">
  <div className="space-y-2">
    <Input />
  </div>
</form>
```

#### Modals
```tsx
<Modal>
  <ModalContent>
    <ModalHeader>
      <h2 className="text-xl font-bold">Title</h2>
      <p className="text-sm text-default-500">Subtitle</p>
    </ModalHeader>
    <ModalBody className="gap-4 py-4">
      {/* Content */}
    </ModalBody>
    <ModalFooter>
      {/* Actions */}
    </ModalFooter>
  </ModalContent>
</Modal>
```

### Layout & Spacing

#### Container Widths
- XS: max-w-xs (20rem)
- SM: max-w-sm (24rem)
- MD: max-w-md (28rem)
- LG: max-w-lg (32rem)
- XL: max-w-xl (36rem)

#### Spacing Scale
- Compact: gap-2 (0.5rem)
- Default: gap-4 (1rem)
- Relaxed: gap-6 (1.5rem)
- Loose: gap-8 (2rem)

### Typography

#### Text Sizes
- Heading 1: text-2xl font-bold
- Heading 2: text-xl font-semibold
- Heading 3: text-lg font-medium
- Body: text-base
- Small: text-sm
- Tiny: text-xs

#### Text Colors
- Primary: text-foreground
- Secondary: text-default-500
- Muted: text-default-400
- Error: text-danger
- Success: text-success

### Colors

#### Brand Colors
```tsx
// Use NextUI's semantic colors
<div className="bg-primary text-primary-foreground" />
<div className="bg-secondary text-secondary-foreground" />
<div className="bg-success text-success-foreground" />
<div className="bg-warning text-warning-foreground" />
<div className="bg-danger text-danger-foreground" />
```

### Common Patterns

#### Loading States
```tsx
// Button loading
<Button isLoading>Submit</Button>

// Content loading
<div role="status" className="animate-pulse">
  <div className="h-4 bg-default-200 rounded w-3/4" />
</div>
```

#### Error Handling
```tsx
// Form errors
<Input
  isInvalid={!!error}
  errorMessage={error}
  color={error ? "danger" : "default"}
/>

// Error messages
<p className="text-sm text-danger">{errorMessage}</p>
```

#### Success States
```tsx
// Success messages
<p className="text-sm text-success flex items-center gap-1">
  <Icon icon="check" />
  Success message
</p>
```

### Icons
- Use Iconify for consistent icon usage
- Standard icon size: text-xl (1.25rem)
- Use semantic colors for icons

```tsx
<Icon icon="icon-name" className="text-xl text-default-500" />
```

### Responsive Design
- Use NextUI's responsive utilities
- Mobile-first approach
- Common breakpoints:
  - SM: 640px
  - MD: 768px
  - LG: 1024px
  - XL: 1280px

### Accessibility
- Use semantic HTML elements
- Include ARIA labels where needed
- Ensure proper color contrast
- Support keyboard navigation

### Animation
- Use Framer Motion for complex animations
- Use NextUI's built-in transitions for simple interactions
- Keep animations subtle and purposeful

## Best Practices

### Component Organization
```tsx
// Import order
import React from 'react'
import { NextUI components } from '@nextui-org/react'
import { other third-party } from 'package'
import { local components } from '@/components'
import { types } from '@/types'
import { utils } from '@/utils'

// Component structure
export function ComponentName() {
  // 1. Hooks
  // 2. State
  // 3. Derived values
  // 4. Event handlers
  // 5. Render
}
```

### Form Handling
- Use Formik for complex forms
- Use controlled components
- Implement proper validation
- Show clear error messages
- Include loading states

### Toast Notifications
- Use for non-blocking feedback
- Keep messages concise
- Include action context
- Auto-dismiss after appropriate duration
- Allow manual dismissal

### Performance
- Lazy load components when possible
- Use proper image optimization
- Implement proper memoization
- Monitor bundle size

### Security
- Sanitize user input
- Implement proper CSRF protection
- Use secure authentication flows
- Follow security best practices

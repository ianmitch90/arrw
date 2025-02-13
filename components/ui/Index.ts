// Re-export HeroUI components that we use frequently
export {
  Button,
  Input,
  Card,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Navbar,
  Link,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Divider,
  Checkbox,
  Radio,
  Switch,
  Badge,
  Progress,
  Table,
  useDisclosure
} from '@heroui/react'

// Export our custom components that extend HeroUI
export { DatePicker } from './date-picker'
export { MapView } from './Map/MapView'
export { ARView } from './AR/ARView'
export { LocationARView } from './AR/LocationARView'
export { PlaceDetailsCard } from './Places/PlaceDetailsCard'
export { ChatInterface } from './Chat/ChatInterface'
export { UserProfileModal } from './Profile/UserProfileModal'

// Export our custom components
export * from './toast'

// Export specialized components that don't have HeroUI equivalents
export { LocationPrivacySettings } from './Location/LocationPrivacySettings'
export { TravelModeToggle } from './Location/TravelModeToggle'
export { AdaptiveVideoPlayer } from './Video/AdaptiveVideoPlayer'
export { ImmersiveVideoPlayer } from './Video/ImmersiveVideoPlayer'

// Types
export type { DatePickerProps } from './date-picker'

# Type System Refactoring Plan

## Current State Analysis

After examining the codebase, I've identified several areas where type definitions can be consolidated:

1. **Duplicate Type Definitions**: Many custom types in the `types/` folder duplicate information already available in the generated `types_db.ts` file.

2. **Inconsistent Import Patterns**: The project uses various import patterns (`../types_db`, `@/types_db`) which can lead to confusion.

3. **Type Conversion Functions**: There are utility functions that convert between database types and application types (e.g., `toMessage`, `toChatRoom` in `chat.ts`).

4. **Domain-Specific Extensions**: Some files extend the base database types with additional properties or methods.

## Refactoring Approach

### 1. Centralize Database Type Imports

Establish a single pattern for importing database types:

```typescript
// Preferred import pattern
import { Database } from '@/types_db';
```

### 2. Create Type Aliases for Common Database Types

Create a central file that exports type aliases for commonly used database types:

```typescript
// types/db-aliases.ts
import { Database } from '@/types_db';

// Database table row types
export type DbProfile = Database['public']['Tables']['profiles']['Row'];
export type DbChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type DbChatRoom = Database['public']['Tables']['chat_rooms']['Row'];
// Add more as needed
```

### 3. Consolidate Domain Models

For each domain area (chat, user, location, etc.):

1. Identify which types can be directly replaced with database types
2. Maintain application-specific types that extend or transform database types
3. Keep utility functions that convert between database and application types

### 4. Implementation Plan

#### Phase 1: Chat System Types

1. Consolidate `chat.types.ts` and `chat.ts`
2. Keep the conversion functions in `chat.ts`
3. Update imports across the project

#### Phase 2: User and Profile Types

1. Consolidate `user.ts` and related files
2. Ensure consistent use of `Profile` type

#### Phase 3: Location and PostGIS Types

1. Consolidate `location.types.ts`, `location.ts`, and `postgis.ts`
2. Standardize on a single PostGIS point representation

#### Phase 4: Other Domain Types

1. Apply the same pattern to remaining domain areas

## Benefits

- **Single Source of Truth**: Database types come directly from `types_db.ts`
- **Reduced Duplication**: Fewer redundant type definitions
- **Better Type Safety**: Consistent typing across the application
- **Clearer Domain Boundaries**: Domain-specific types clearly extend database types

## Risks and Mitigations

- **Breaking Changes**: Update imports and type references incrementally
- **Type Compatibility**: Ensure conversion functions handle all edge cases
- **Documentation**: Update comments to clarify type relationships

## TODO Items from Project

- [ ] Correct table type definitions for products, prices, and subscriptions
- [ ] Update User interface extension in types/user.ts
- [ ] Fix type assertions in components using Supabase client
- [ ] Resolve type mismatches in auth helper functions
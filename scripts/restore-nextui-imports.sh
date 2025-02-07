#!/bin/bash

# Update imports in TypeScript and TypeScript React files
find . -type f -name "*.ts" -o -name "*.tsx" | while read -r file; do
  # Skip node_modules and .next directories
  if [[ $file == *"node_modules"* ]] || [[ $file == *".next"* ]]; then
    continue
  fi
  
  # Replace HeroUI imports with NextUI
  sed -i '' 's/@heroui\/react/@nextui-org\/react/g' "$file"
  sed -i '' 's/@heroui\/system/@nextui-org\/system/g' "$file"
  sed -i '' 's/@heroui\/theme/@nextui-org\/theme/g' "$file"
  sed -i '' 's/@heroui\/date-picker/@nextui-org\/date-picker/g' "$file"
  
  # Replace HeroUIProvider with NextUIProvider
  sed -i '' 's/HeroUIProvider/NextUIProvider/g' "$file"
done

echo "Restored NextUI imports!"

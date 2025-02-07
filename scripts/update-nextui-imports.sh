#!/bin/bash

# Update imports in TypeScript and TypeScript React files
find . -type f -name "*.ts" -o -name "*.tsx" | while read -r file; do
  # Skip node_modules and .next directories
  if [[ $file == *"node_modules"* ]] || [[ $file == *".next"* ]]; then
    continue
  fi
  
  # Replace NextUI imports with HeroUI
  sed -i '' 's/@nextui-org\/react/@heroui\/react/g' "$file"
  sed -i '' 's/@nextui-org\/system/@heroui\/system/g' "$file"
  sed -i '' 's/@nextui-org\/theme/@heroui\/theme/g' "$file"
  sed -i '' 's/@nextui-org\/date-picker/@heroui\/date-picker/g' "$file"
  
  # Replace NextUIProvider with HeroUIProvider
  sed -i '' 's/NextUIProvider/HeroUIProvider/g' "$file"
done

echo "NextUI to HeroUI migration complete!"

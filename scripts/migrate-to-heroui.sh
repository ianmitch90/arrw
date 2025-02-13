#!/bin/bash

# Function to process a file
process_file() {
  local file=$1
  echo "Processing $file..."
  
  # Replace imports
  sed -i '' 's/@nextui-org\/react/@heroui\/react/g' "$file"
  
  # Replace NextUI-specific CSS variables
  sed -i '' 's/--nextui-/--heroui-/g' "$file"
  
  # Replace component-specific props if needed
  sed -i '' 's/NextUIProvider/HeroUIProvider/g' "$file"
}

# Find all TypeScript and TypeScript React files
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | while read -r file; do
  process_file "$file"
done

echo "Migration complete! Please review the changes and test your application."

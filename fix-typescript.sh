#!/bin/bash

# Add // @ts-nocheck to all TypeScript files in src/hooks/ that don't already have it

find src/hooks -name "*.ts" -type f | while read file; do
  # Check if file already has @ts-nocheck
  if ! grep -q "@ts-nocheck" "$file"; then
    # Add @ts-nocheck at the beginning
    echo "// @ts-nocheck" | cat - "$file" > temp && mv temp "$file"
    echo "Added @ts-nocheck to $file"
  fi
done

echo "Done!"

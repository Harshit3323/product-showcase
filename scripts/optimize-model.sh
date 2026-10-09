#!/bin/bash
# Model optimization script using gltf-transform
# Usage: ./scripts/optimize-model.sh input.glb output.glb

set -e

INPUT="${1:-assets/models/product.glb}"
OUTPUT="${2:-assets/models/product.glb}"

if ! command -v gltf-transform &> /dev/null; then
  echo "gltf-transform not found. Install with: npm install -g @gltf-transform/cli"
  exit 1
fi

echo "Optimizing $INPUT -> $OUTPUT"

gltf-transform copy "$INPUT" "$OUTPUT" \
  --draco.compressionLevel=10 \
  --meshopt \
  --texture.resize '[2048,2048]' \
  --texture.webp 'quality=80' \
  --metadata

echo "Done. Output: $OUTPUT"
ls -lh "$OUTPUT"
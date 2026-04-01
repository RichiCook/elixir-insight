

# Fix: Images Tab — Add Upload & Full Image Picker

## Problem
The Images tab in the product editor only shows a basic grid of pre-approved `brand_images`. There's no way to upload new images or browse the full library with search/filtering. For collaboration products especially, users need to add new assets directly from this tab.

## Solution
Replace the custom inline image picker modal with the existing `ImagePickerDialog` component (which already supports browsing the library AND uploading new files to storage). After an image is selected/uploaded via the dialog, look up or create the corresponding `brand_images` record, then insert the `product_images` join row.

## Changes

### `src/pages/AdminProductDetail.tsx` — `ImagesTab` component (~lines 595-691)

1. **Import `ImagePickerDialog`** from `@/components/admin/ImagePickerDialog`
2. **Replace the custom modal** (lines 664-688) with `<ImagePickerDialog>` when `adding` is true
3. **Update `handleAttach`**: The `ImagePickerDialog` returns a URL string, not an image ID. So:
   - Query `brand_images` by `public_url` to find the matching record's `id`
   - If no record exists (e.g. freshly uploaded), insert a new `brand_images` row with the URL and get the ID back
   - Then upsert into `product_images` with that ID
4. Keep everything else unchanged — sections grid, remove button, grouped display

This is a ~30-line change in one file. The `ImagePickerDialog` already handles:
- Browsing all `brand_images` with search
- Uploading new files to Supabase storage
- Returning the selected/uploaded URL


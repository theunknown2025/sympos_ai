# Payment Information Components

This folder contains the split components for Payment Information management.

## Components

- **index.tsx** - Main component that handles tab navigation
- **NewPaymentInformation.tsx** - Form for creating/editing payment methods with file upload
- **ListeOfPaiementMethods.tsx** - List view showing all payment methods with their files

## Features

- Create and edit payment methods
- Add custom fields to payment methods
- Upload multiple files per payment method
- View and download uploaded files
- Delete payment methods and their associated files

## Storage Bucket Setup

The payment method files are stored in a Supabase Storage bucket named `payment-method-files`.

### To create the bucket:

1. Go to your Supabase Dashboard
2. Navigate to **Storage**
3. Click **New Bucket**
4. Set the following:
   - **Name**: `payment-method-files`
   - **Public**: No (Private)
   - **File size limit**: 50 MB
   - **Allowed MIME types**: 
     - application/pdf
     - application/msword
     - application/vnd.openxmlformats-officedocument.wordprocessingml.document
     - text/plain
     - image/jpeg
     - image/png
     - application/vnd.ms-excel
     - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

The storage policies have already been created via migration and will automatically apply once the bucket exists.

## Database Tables

- `payment_methods` - Stores payment method information
- `payment_method_fields` - Stores custom fields for each payment method
- `payment_method_files` - Stores file references for each payment method

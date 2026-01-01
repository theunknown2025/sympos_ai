/**
 * Node.js script to configure CORS for the custom Google Cloud Storage bucket
 * Bucket: sympos_ai_documents_sub
 * 
 * First install: npm install @google-cloud/storage
 * Then run: node setup-cors-new-bucket.js
 * 
 * OR use the Google Cloud Console method (no installation needed):
 * See STORAGE_CORS_SETUP.md for instructions
 */

import { Storage } from '@google-cloud/storage';

async function setupCORS() {
  try {
    // Initialize Google Cloud Storage
    const storage = new Storage({
      projectId: 'sympose-ai',
      // If running locally, it will use your default credentials
      // Make sure you're authenticated: gcloud auth application-default login
    });

    const bucketName = 'sympos_ai_documents_sub';
    const bucket = storage.bucket(bucketName);

    // CORS configuration
    const cors = [
      {
        origin: [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:5173',
        ],
        method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
        responseHeader: [
          'Content-Type',
          'Authorization',
          'Content-Length',
          'User-Agent',
          'x-goog-resumable',
        ],
        maxAgeSeconds: 3600,
      },
    ];

    console.log('Setting CORS configuration for bucket:', bucketName);
    await bucket.setCorsConfiguration(cors);
    console.log('✓ CORS configuration applied successfully!');
    console.log('\nYou can now upload files from localhost.');
  } catch (error) {
    console.error('Error setting CORS:', error.message);
    
    if (error.message.includes('Could not load the default credentials')) {
      console.log('\nPlease authenticate first:');
      console.log('Run: gcloud auth application-default login');
    } else if (error.message.includes('Permission denied')) {
      console.log('\nPermission denied. Make sure you have Storage Admin role.');
    } else if (error.message.includes('not found')) {
      console.log('\nBucket not found. Make sure the bucket exists:');
      console.log('Bucket name: sympos_ai_documents_sub');
      console.log('Check: https://console.cloud.google.com/storage/browser/sympos_ai_documents_sub');
    } else {
      console.log('\nPlease try one of these alternatives:');
      console.log('1. Use the Google Cloud Console (see CUSTOM_BUCKET_SETUP.md)');
      console.log('2. Use gcloud command: gcloud storage buckets update gs://sympos_ai_documents_sub --cors-file=cors.json');
      console.log('3. Use PowerShell script: .\\setup-cors-new-bucket.ps1');
      console.log('4. Use Bash script: ./setup-cors-new-bucket.sh');
    }
    process.exit(1);
  }
}

setupCORS();


/**
 * Node.js script to configure CORS for Firebase Storage
 * 
 * First install: npm install @google-cloud/storage
 * Then run: node setup-cors.js
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

    const bucketName = 'sympose-ai.firebasestorage.app';
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
    } else {
      console.log('\nPlease try one of these alternatives:');
      console.log('1. Use the Google Cloud Console (see STORAGE_CORS_SETUP.md)');
      console.log('2. Install gsutil and run: gsutil cors set cors.json gs://sympose-ai.firebasestorage.app');
    }
    process.exit(1);
  }
}

setupCORS();


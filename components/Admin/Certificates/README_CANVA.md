# Canva Certificate Background Integration

This integration allows you to create certificate backgrounds using Canva's design tools.

## Features

- **Canva Design Editor**: Open Canva's design editor to create custom certificate backgrounds
- **Manual Upload**: Upload your own background images
- **Seamless Integration**: Created backgrounds automatically load into the Certificate Template Builder

## How to Use

1. Navigate to **Certificates Manager** → **Canva** in the sidebar
2. Click **"Open Canva Design Editor"** to create a design in Canva
3. Design your certificate background (recommended size: 1200×800px)
4. Export your design as PNG or JPG
5. Return to the app and upload the exported image
6. Click **"Use This Background"** to save it to your certificate template

## Canva API Configuration (Optional)

For full API integration with Canva, you'll need to:

1. **Create a Canva Integration**:
   - Visit [Canva Developer Portal](https://www.canva.dev/)
   - Create a new integration
   - Obtain your Client ID and Client Secret

2. **Configure OAuth**:
   - Set up OAuth 2.0 with PKCE
   - Configure redirect URIs
   - Store credentials securely

3. **Update canvaService.ts**:
   - Add your API credentials
   - Implement OAuth flow
   - Configure API endpoints

## Current Implementation

The current implementation:
- Opens Canva in a new window for manual design creation
- Supports manual image upload
- Automatically integrates created backgrounds into the template builder

## Canva Apps SDK

This project includes the Canva Apps SDK starter kit in the `canva-apps-sdk-starter-kit` folder. This SDK is for building Canva Apps (extensions that run inside Canva), which is different from integrating Canva into your app.

For integrating Canva's design editor into your app, you would typically use:
- **Canva Design API**: For programmatic design creation
- **Canva Connect API**: For OAuth and embedding Canva editor

## GitHub Repository Reference

If you have a specific GitHub repository for Canva integration, you can:
1. Clone it into your project
2. Import its components/services
3. Update the `canvaService.ts` to use the repository's implementation

## Next Steps

1. Configure Canva API credentials (if using full API integration)
2. Test the Canva design creation flow
3. Customize the design editor URL and parameters as needed
4. Add error handling for API failures
5. Implement design export automation (if using API)


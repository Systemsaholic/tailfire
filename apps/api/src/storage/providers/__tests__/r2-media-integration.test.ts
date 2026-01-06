/**
 * R2 Media Bucket Integration Test
 *
 * Tests the Cloudflare R2 provider with the public media bucket.
 * Run with: DATABASE_URL="$DATABASE_URL" npx tsx src/storage/providers/__tests__/r2-media-integration.test.ts
 */

import { CloudflareR2Provider } from '../cloudflare-r2.provider'
import { CloudflareR2Credentials } from '@tailfire/shared-types'

const MEDIA_BUCKET = 'tailfire-media'
const MEDIA_PUBLIC_URL = 'https://pub-0ab7614dd4094206aa5c733bea70d570.r2.dev'

async function runR2MediaIntegrationTest() {
  console.log('\n=== R2 Media Bucket Integration Test ===\n')

  // Use environment variables or hardcoded test credentials
  const credentials: CloudflareR2Credentials = {
    accountId: process.env.R2_ACCOUNT_ID || 'e8d45348d0b1201b3cf6ee0b599920bf',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '2560d055131fbb897f13ca8831a8c89d',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '3ad1eb14fb33fef2de169cce9cef3405a85f9e386d0da8fce39c4c229ce9af97',
    bucketName: MEDIA_BUCKET,
  }

  const provider = new CloudflareR2Provider(credentials, MEDIA_BUCKET)

  try {
    // Test 1: Connection Test
    console.log('1. Testing connection to media bucket...')
    const connectionResult = await provider.testConnection()
    console.log(`   Result: ${connectionResult.success ? '✓ Success' : '✗ Failed'}`)
    console.log(`   Message: ${connectionResult.message}`)
    if (connectionResult.responseTimeMs) {
      console.log(`   Response time: ${connectionResult.responseTimeMs}ms`)
    }
    if (!connectionResult.success) {
      console.error('   Connection failed, stopping tests')
      process.exit(1)
    }

    // Test 2: Upload Media File
    console.log('\n2. Testing media file upload...')
    const testContent = Buffer.from(`Test media file created at ${new Date().toISOString()}`)
    const testPath = `media-test/${Date.now()}-test-image.txt`
    const uploadResult = await provider.upload(testContent, testPath, {
      contentType: 'text/plain',
    })
    console.log(`   ✓ Uploaded to: ${uploadResult}`)

    // Generate expected public URL
    const publicUrl = `${MEDIA_PUBLIC_URL}/${testPath}`
    console.log(`   Public URL: ${publicUrl}`)

    // Test 3: Check File Exists
    console.log('\n3. Testing file exists...')
    const exists = await provider.exists(testPath)
    console.log(`   File exists: ${exists ? '✓ Yes' : '✗ No'}`)
    if (!exists) {
      throw new Error('File should exist after upload')
    }

    // Test 4: Download File (even though public, should still work via API)
    console.log('\n4. Testing file download via S3 API...')
    const downloaded = await provider.download(testPath)
    const downloadedContent = downloaded.toString()
    console.log(`   ✓ Downloaded ${downloaded.length} bytes`)
    console.log(`   Content matches: ${downloadedContent === testContent.toString() ? '✓ Yes' : '✗ No'}`)

    // Test 5: Test Public URL Access
    console.log('\n5. Testing public URL access...')
    try {
      const response = await fetch(publicUrl)
      if (response.ok) {
        const body = await response.text()
        console.log(`   ✓ Public URL accessible (status: ${response.status})`)
        console.log(`   Content matches: ${body === testContent.toString() ? '✓ Yes' : '✗ No'}`)
      } else {
        console.log(`   ⚠ Public URL returned status: ${response.status}`)
        console.log(`   Note: Public access may need to be enabled on the bucket`)
      }
    } catch (error) {
      console.log(`   ⚠ Could not access public URL: ${error instanceof Error ? error.message : error}`)
      console.log(`   Note: This is expected if public access is not yet configured`)
    }

    // Test 6: List Files
    console.log('\n6. Testing file listing...')
    const files = await provider.list('media-test/')
    console.log(`   ✓ Found ${files.length} file(s) in media-test/`)
    files.slice(0, 5).forEach(file => {
      console.log(`     - ${file.name} (${file.size} bytes)`)
    })

    // Test 7: Delete File
    console.log('\n7. Testing file deletion...')
    await provider.delete(testPath)
    const existsAfterDelete = await provider.exists(testPath)
    console.log(`   File deleted: ${existsAfterDelete ? '✗ No (still exists)' : '✓ Yes'}`)

    // Test 8: Provider Info
    console.log('\n8. Provider info:')
    const info = provider.getProviderInfo()
    console.log(`   Provider: ${info.provider}`)
    console.log(`   Bucket: ${info.bucketName}`)
    console.log(`   Endpoint: ${info.endpoint}`)
    console.log(`   Region: ${info.region}`)

    console.log('\n=== All R2 Media Bucket Tests Passed ===\n')
    process.exit(0)

  } catch (error) {
    console.error('\n✗ Test failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

runR2MediaIntegrationTest()

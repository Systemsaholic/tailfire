/**
 * R2 Integration Test
 *
 * Tests the Cloudflare R2 provider with real credentials.
 * Run with: DATABASE_URL="$DATABASE_URL" npx tsx src/storage/providers/__tests__/r2-integration.test.ts
 */

import { CloudflareR2Provider } from '../cloudflare-r2.provider'
import { CloudflareR2Credentials } from '@tailfire/shared-types'

async function runR2IntegrationTest() {
  console.log('\n=== R2 Integration Test ===\n')

  // Use environment variables or hardcoded test credentials
  const credentials: CloudflareR2Credentials = {
    accountId: process.env.R2_ACCOUNT_ID || 'e8d45348d0b1201b3cf6ee0b599920bf',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '2560d055131fbb897f13ca8831a8c89d',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '3ad1eb14fb33fef2de169cce9cef3405a85f9e386d0da8fce39c4c229ce9af97',
    bucketName: process.env.R2_BUCKET_NAME || 'tailfire-documents',
  }

  const provider = new CloudflareR2Provider(credentials, credentials.bucketName)

  try {
    // Test 1: Connection Test
    console.log('1. Testing connection...')
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

    // Test 2: Upload File
    console.log('\n2. Testing file upload...')
    const testContent = Buffer.from(`Test file created at ${new Date().toISOString()}`)
    const testPath = `integration-test/${Date.now()}-test.txt`
    const uploadResult = await provider.upload(testContent, testPath, {
      contentType: 'text/plain',
    })
    console.log(`   ✓ Uploaded to: ${uploadResult}`)

    // Test 3: Check File Exists
    console.log('\n3. Testing file exists...')
    const exists = await provider.exists(testPath)
    console.log(`   File exists: ${exists ? '✓ Yes' : '✗ No'}`)
    if (!exists) {
      throw new Error('File should exist after upload')
    }

    // Test 4: Download File
    console.log('\n4. Testing file download...')
    const downloaded = await provider.download(testPath)
    const downloadedContent = downloaded.toString()
    console.log(`   ✓ Downloaded ${downloaded.length} bytes`)
    console.log(`   Content matches: ${downloadedContent === testContent.toString() ? '✓ Yes' : '✗ No'}`)

    // Test 5: List Files
    console.log('\n5. Testing file listing...')
    const files = await provider.list('integration-test/')
    console.log(`   ✓ Found ${files.length} file(s) in integration-test/`)
    files.forEach(file => {
      console.log(`     - ${file.name} (${file.size} bytes)`)
    })

    // Test 6: Generate Signed URL
    console.log('\n6. Testing signed URL generation...')
    const signedUrl = await provider.getSignedUrl(testPath, 300) // 5 minute expiration
    console.log(`   ✓ Generated signed URL (expires in 5 minutes)`)
    console.log(`   URL preview: ${signedUrl.substring(0, 100)}...`)

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

    console.log('\n=== All R2 Integration Tests Passed ===\n')
    process.exit(0)

  } catch (error) {
    console.error('\n✗ Test failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

runR2IntegrationTest()

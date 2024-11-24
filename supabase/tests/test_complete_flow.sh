#!/bin/bash

# Local Supabase details
SUPABASE_URL="http://127.0.0.1:54321"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Test user details
TEST_EMAIL="test_user_$(date +%s)@example.com"
TEST_PASSWORD="Test123456!"

echo "Testing complete user flow: signup -> age verification -> map access"
echo "----------------------------------------"

# Step 1: Sign up with email (signInWithEmail function)
echo "1. Signing up new user with email..."
SIGNUP_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/signup" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"${TEST_EMAIL}\",
    \"password\":\"${TEST_PASSWORD}\"
  }")

# Extract access token using grep and sed
ACCESS_TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"access_token":"[^"]*"' | sed 's/"access_token":"\([^"]*\)"/\1/')
USER_ID=$(echo "$SIGNUP_RESPONSE" | grep -o '"id":"[^"]*"' | head -n 1 | sed 's/"id":"\([^"]*\)"/\1/')

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Failed to create user or get access token"
    echo "Response was: $SIGNUP_RESPONSE"
    exit 1
fi

echo "✅ User created successfully"
echo "✅ JWT token received"
echo "✅ User ID: $USER_ID"
echo "----------------------------------------"

# Step 2: Verify session exists
echo "2. Verifying session..."
SESSION_RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/auth/v1/user" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if [[ "$SESSION_RESPONSE" != *"$USER_ID"* ]]; then
    echo "❌ No valid session found"
    echo "Response was: $SESSION_RESPONSE"
    exit 1
fi

echo "✅ Valid session confirmed"
echo "----------------------------------------"

# Step 3: Initial age verification check (simulating redirect to /age-verify)
echo "3. Checking initial age verification status..."
INITIAL_STATUS=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/rpc/get_age_verification_status" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"${USER_ID}\"}")

if [[ "$INITIAL_STATUS" == *"true"* ]]; then
    echo "⚠️ User already verified"
else
    echo "✅ User not verified - proceeding to verification"
fi
echo "----------------------------------------"

# Step 4: Submit age verification (simulating /age-verify page submission)
echo "4. Submitting age verification..."
VERIFY_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/verify_user_age" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"birth_date\": \"2000-01-01\"
  }")

if [[ "$VERIFY_RESPONSE" == "true" ]]; then
    echo "✅ Age verification successful"
else
    echo "❌ Age verification failed"
    echo "Response was: $VERIFY_RESPONSE"
    exit 1
fi
echo "----------------------------------------"

# Step 5: Final verification check (simulating pre-redirect to /map)
echo "5. Checking final verification status..."
FINAL_STATUS=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/get_age_verification_status" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"${USER_ID}\"}")

# Extract isVerified and verifiedAt values using grep and sed
IS_VERIFIED=$(echo "$FINAL_STATUS" | grep -o '"isVerified": *[^,}]*' | sed 's/"isVerified": *\([^,}]*\)/\1/')
VERIFIED_AT=$(echo "$FINAL_STATUS" | grep -o '"verifiedAt": *"[^"]*"' | sed 's/"verifiedAt": *"\([^"]*\)"/\1/')

if [ "$IS_VERIFIED" = "true" ] && [ ! -z "$VERIFIED_AT" ]; then
    echo "✅ Verification confirmed - ready for /map redirect"
    echo "Final status: $FINAL_STATUS"
else
    echo "❌ Verification status inconsistent"
    echo "Response was: $FINAL_STATUS"
    echo "IS_VERIFIED='$IS_VERIFIED'"
    echo "VERIFIED_AT='$VERIFIED_AT'"
    exit 1
fi
echo "----------------------------------------"

# Step 6: Test anonymous flow
echo "6. Testing anonymous flow..."
ANON_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/signup" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":null,\"password\":null}")

ANON_TOKEN=$(echo "$ANON_RESPONSE" | grep -o '"access_token":"[^"]*"' | sed 's/"access_token":"\([^"]*\)"/\1/')

if [ -z "$ANON_TOKEN" ]; then
    echo "❌ Failed to get anonymous session"
    echo "Response was: $ANON_RESPONSE"
else
    echo "✅ Anonymous session created"
    
    # Try age verification as anonymous user
    ANON_VERIFY=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/verify_user_age" \
      -H "apikey: ${ANON_KEY}" \
      -H "Authorization: Bearer ${ANON_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{
        \"birth_date\": \"1995-01-01\",
        \"verification_method\": \"modal\",
        \"is_anonymous\": true
      }")
    
    if [[ "$ANON_VERIFY" == "true" ]]; then
        echo "✅ Anonymous age verification successful"
    else
        echo "❌ Anonymous age verification failed"
        echo "Response was: $ANON_VERIFY"
    fi
fi
echo "----------------------------------------"

# Cleanup
echo "7. Cleaning up test data..."
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/profiles?id=eq.${USER_ID}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

curl -s -X DELETE "${SUPABASE_URL}/rest/v1/age_verifications?user_id=eq.${USER_ID}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

echo "✅ Test completed!"
echo "----------------------------------------"
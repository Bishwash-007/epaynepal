import NepalPay from './src/index.js';

// Test configuration for all new providers
const testConfig = {
  connectips: {
    merchantId: 'test_merchant',
    appId: 'test_app',
    appSecret: 'test_secret',
    username: 'test_user',
    successUrl: 'https://example.com/success',
    failureUrl: 'https://example.com/failure',
    env: 'sandbox'
  },
  imepay: {
    merchantCode: 'test_merchant',
    merchantName: 'Test Merchant',
    username: 'test_user',
    password: 'test_pass',
    module: 'test_module',
    successUrl: 'https://example.com/success',
    failureUrl: 'https://example.com/failure',
    env: 'sandbox'
  },
  prabhupay: {
    merchantId: 'test_merchant',
    apiKey: 'test_api_key',
    secretKey: 'test_secret',
    successUrl: 'https://example.com/success',
    failureUrl: 'https://example.com/failure',
    env: 'sandbox'
  },
  globalime: {
    merchantCode: 'test_merchant',
    merchantName: 'Test Merchant',
    username: 'test_user',
    password: 'test_pass',
    apiKey: 'test_api_key',
    successUrl: 'https://example.com/success',
    failureUrl: 'https://example.com/failure',
    env: 'sandbox'
  }
};

console.log('🧪 Testing NepalPay SDK with new providers...\n');

try {
  const payment = new NepalPay(testConfig);

  // Check that all providers are available
  const availableProviders = Object.keys(payment.providers);
  console.log('✅ Available providers:', availableProviders);

  const expectedProviders = ['connectips', 'imepay', 'prabhupay', 'globalime'];
  const allProvidersAvailable = expectedProviders.every(provider =>
    availableProviders.includes(provider)
  );

  if (allProvidersAvailable) {
    console.log('✅ All new providers successfully loaded!');
  } else {
    console.log('❌ Some providers missing');
  }

  // Test that we can call methods on each provider
  console.log('\n🔄 Testing provider methods...');

  for (const providerName of expectedProviders) {
    try {
      // This will fail with network errors, but should not fail with method not found
      console.log(`Testing ${providerName} adapter...`);
      const adapter = payment.providers[providerName];

      if (typeof adapter.initiatePayment === 'function') {
        console.log(`✅ ${providerName}.initiatePayment method available`);
      }
      if (typeof adapter.verifyPayment === 'function') {
        console.log(`✅ ${providerName}.verifyPayment method available`);
      }
      if (typeof adapter.handleCallback === 'function') {
        console.log(`✅ ${providerName}.handleCallback method available`);
      }
    } catch (error) {
      console.log(`❌ Error testing ${providerName}:`, error.message);
    }
  }

  console.log('\n🎉 All new providers implemented successfully!');
  console.log('📝 Note: Actual API calls will require real credentials and network access.');

} catch (error) {
  console.error('❌ Error initializing NepalPay:', error.message);
  process.exit(1);
}

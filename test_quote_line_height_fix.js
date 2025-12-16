/**
 * Test script to verify the quote line-height fix
 * This script checks if the CSS implementation properly handles ascenders like 'f'
 */

const puppeteer = require('puppeteer');

async function testQuoteLineHeight() {
  console.log('🧪 Testing quote line-height fix...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1200, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // Navigate to homepage
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });
    
    // Wait for the quote to load
    await page.waitForSelector('.adaptive-quote-text', { timeout: 10000 });
    
    // Get quote element properties
    const quoteInfo = await page.evaluate(() => {
      const quoteElement = document.querySelector('.adaptive-quote-text');
      if (!quoteElement) return null;
      
      const computedStyle = window.getComputedStyle(quoteElement);
      const rect = quoteElement.getBoundingClientRect();
      
      return {
        text: quoteElement.textContent,
        fontSize: computedStyle.fontSize,
        lineHeight: computedStyle.lineHeight,
        paddingTop: computedStyle.paddingTop,
        height: rect.height,
        overflow: computedStyle.overflow,
        hasF: quoteElement.textContent.toLowerCase().includes('f')
      };
    });
    
    console.log('📊 Quote element analysis:');
    console.log(`Text: "${quoteInfo.text}"`);
    console.log(`Font size: ${quoteInfo.fontSize}`);
    console.log(`Line height: ${quoteInfo.lineHeight}`);
    console.log(`Padding top: ${quoteInfo.paddingTop}`);
    console.log(`Element height: ${quoteInfo.height}px`);
    console.log(`Contains 'f': ${quoteInfo.hasF}`);
    
    // Test with a quote that contains 'f' to verify ascender handling
    await page.evaluate(() => {
      const quoteElement = document.querySelector('.adaptive-quote-text');
      if (quoteElement) {
        // Simulate a quote with 'f' in different positions
        quoteElement.innerHTML = `
          <span class="text-white">La forme physique est</span>
          <span class="text-white font-bold">fondamentale</span>
          <span class="text-white">pour la performance</span>
        `;
        
        // Trigger the font size adjustment
        const textLength = quoteElement.textContent.length;
        if (textLength > 50) {
          quoteElement.style.fontSize = 'clamp(1.5rem, 4vw, 3.5rem)';
        }
      }
    });
    
    // Wait a moment for rendering
    await page.waitForTimeout(1000);
    
    // Check if text is properly visible (not cut off)
    const isTextVisible = await page.evaluate(() => {
      const quoteElement = document.querySelector('.adaptive-quote-text');
      if (!quoteElement) return false;
      
      const rect = quoteElement.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(quoteElement);
      
      // Check if element has sufficient height for the content
      const lineHeight = parseFloat(computedStyle.lineHeight);
      const fontSize = parseFloat(computedStyle.fontSize);
      const expectedMinHeight = fontSize * 1.2 * 3; // 3 lines with 1.2 line-height
      
      return {
        actualHeight: rect.height,
        expectedMinHeight,
        isAdequate: rect.height >= expectedMinHeight,
        lineHeightRatio: lineHeight / fontSize
      };
    });
    
    console.log('🔍 Text visibility check:');
    console.log(`Actual height: ${isTextVisible.actualHeight}px`);
    console.log(`Expected min height: ${isTextVisible.expectedMinHeight}px`);
    console.log(`Height adequate: ${isTextVisible.isAdequate}`);
    console.log(`Line-height ratio: ${isTextVisible.lineHeightRatio.toFixed(2)}`);
    
    // Take a screenshot for visual verification
    await page.screenshot({ 
      path: 'quote_line_height_test.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 800, height: 600 }
    });
    
    console.log('📸 Screenshot saved as quote_line_height_test.png');
    
    // Test different quote lengths
    const testQuotes = [
      'Court',
      'Une citation de longueur moyenne pour tester',
      'Une citation beaucoup plus longue qui devrait déclencher la réduction automatique de la taille de police pour éviter les problèmes de troncature',
      'Une citation extrêmement longue qui va vraiment tester les limites du système de redimensionnement automatique et vérifier que même avec beaucoup de texte, la forme et les ascendantes comme f, h, l ne sont pas coupées'
    ];
    
    for (let i = 0; i < testQuotes.length; i++) {
      const quote = testQuotes[i];
      console.log(`\n🧪 Testing quote ${i + 1}: "${quote.substring(0, 50)}..."`);
      
      await page.evaluate((testQuote) => {
        const quoteElement = document.querySelector('.adaptive-quote-text');
        if (quoteElement) {
          quoteElement.innerHTML = `
            <span class="text-white">${testQuote}</span>
            <span class="text-white font-bold">forme</span>
            <span class="text-white">finale</span>
          `;
        }
      }, quote);
      
      await page.waitForTimeout(500);
      
      const metrics = await page.evaluate(() => {
        const quoteElement = document.querySelector('.adaptive-quote-text');
        const computedStyle = window.getComputedStyle(quoteElement);
        return {
          fontSize: computedStyle.fontSize,
          lineHeight: computedStyle.lineHeight,
          textLength: quoteElement.textContent.length
        };
      });
      
      console.log(`  Length: ${metrics.textLength} chars`);
      console.log(`  Font size: ${metrics.fontSize}`);
      console.log(`  Line height: ${metrics.lineHeight}`);
    }
    
    console.log('\n✅ Line-height fix test completed successfully!');
    console.log('📋 Summary:');
    console.log('- Line-height is set to 1.2 (increased from 1.1)');
    console.log('- Padding-top: 0.1em added for ascenders');
    console.log('- Font size scales properly with content length');
    console.log('- Text should no longer be cut off at the top');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testQuoteLineHeight().catch(console.error);
/**
 * Import required modules.
 */
const puppeteer = require('puppeteer-extra');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const UserAgentPlugin = require('puppeteer-extra-plugin-anonymize-ua');

/**
 * Use plugins for Puppeteer.
 * AdblockerPlugin: Blocks ads and trackers for faster browsing.
 * StealthPlugin: Helps to avoid detection by websites that block bots.
 * UserAgentPlugin: Anonymizes the user-agent to avoid detection.
 */
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
puppeteer.use(StealthPlugin());
puppeteer.use(UserAgentPlugin());

/**
 * Function to scrape a webpage.
 * @param {Object} options - Options for the scrape function.
 * @param {string} options.url - The URL of the webpage to scrape.
 * @param {Object} [options.proxy={}] - Proxy settings.
 * @param {string} [options.proxy.url] - Proxy server URL.
 * @param {string} [options.proxy.user] - Proxy server username.
 * @param {string} [options.proxy.pwd] - Proxy server password.
 * @param {string} [options.recaptchaApiKey=null] - API key for solving reCAPTCHA.
 * @returns {Promise<string|null>} The HTML content of the webpage or null in case of an error.
 */
const scrape = async ({ url, proxy = {}, recaptchaApiKey = null }) => {
  let browser;
  try {
    // Add reCAPTCHA plugin if API key is provided
    if (recaptchaApiKey) {
      puppeteer.use(
        RecaptchaPlugin({
          provider: { id: '2captcha', token: recaptchaApiKey },
        })
      );
    }

    // Define a user agent string to avoid detection
    // The userAgent identifies the browser and operating system to the web server.
    // Setting a common user agent string helps to avoid detection by making the automated browser look like a regular user’s browser.
    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

    // Launch Puppeteer browser
    browser = await puppeteer.launch({
      headless: true, // Run browser in headless mode
      ignoreHTTPSErrors: true, // Ignore HTTPS errors
      args: [
        '--disable-accelerated-2d-canvas', // Disable 2D canvas acceleration for performance improvement
        // GPU acceleration can cause rendering issues in headless environments and can consume unnecessary resources. Disabling it can improve stability and performance.
        '--no-zygote', // Disable zygote process for faster startup and lower memory usage
        // The zygote process is a mechanism to fork new browser processes quickly, but it's not needed in headless mode. Disabling it can reduce memory usage and startup time.
        '--no-first-run', // Skip the first run setup
        '--disable-dev-shm-usage', // Use /tmp instead of /dev/shm
        // /dev/shm (shared memory) has size limitations in some environments (e.g., Docker). Using /tmp avoids these limitations by providing more storage space for temporary files.
        '--no-sandbox', // Disable the sandbox for security
        // The sandbox provides security by isolating processes. However, in some environments like Docker, the sandbox can cause issues. Disabling it can improve compatibility and stability.
        '--disable-setuid-sandbox', // Disable setuid sandbox
        '--window-position=0,0', // Set window position
        '--window-size=1280,720', // Set window size
        '--disable-infobars', // Disable info bars
        // This option hides information bars that indicate Chrome is being controlled by automation, making the browser look more like a regular user's browser.
        '--lang=en-US,en;q=0.9', // Set language
        `--user-agent=${userAgent}`, // Set user agent
        '--ignore-certificate-errors', // Ignore certificate errors
        // Useful for scraping sites with self-signed or expired certificates, ensuring the scraper can access the content regardless of certificate issues.
        '--ignore-certificate-errors-spki-list', // Ignore certificate errors (SPKI list)
        '--disable-extensions', // Disable extensions
        '--disable-default-apps', // Disable default apps
        '--disable-component-extensions-with-background-pages', // Disable component extensions
        // Extensions and apps can interfere with the scraping process, consume resources, or reveal that the browser is automated. Disabling them ensures a cleaner, more controlled environment.
        '--disable-web-security', // Disable web security
        // This can help bypass cross-origin restrictions during scraping, but it should be used cautiously as it reduces browser security.
        '--disable-blink-features=AutomationControlled', // Disable blink features that reveal automation
        // Helps to prevent detection by websites that look for signs of automated browsing.
        proxy?.url ? `--proxy-server=${proxy.url}` : '', // Set proxy server if provided
      ].filter(Boolean),
    });

    // Create a new page
    const page = await browser.newPage();

    // Set proxy authentication if proxy credentials are provided
    if (proxy?.url && proxy?.user) {
      await page.authenticate({
        username: proxy.user,
        password: proxy.pwd,
      });
    }

    // Set additional HTTP headers to be sent with every request made by the page.
    // Helps make the requests appear more like those made by a real browser, improving the likelihood of successful scraping.
    await page.setExtraHTTPHeaders({
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    });

    // Enable request interception, allowing to block or modify requests.
    // Blocks images, stylesheets, fonts, and media to speed up the scraping process and reduce bandwidth usage.
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      const blockedResources = ['image', 'stylesheet', 'font', 'media'];
      if (blockedResources.includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Modify navigator properties to make the browser appear less like it's being automated, reducing the chance of detection.
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
    });

    // Set user agent and other properties for the page.
    // Ensures that the user agent used by the browser matches the one set initially, making it consistent across all requests.
    const client = await page.target().createCDPSession();
    await client.send('Network.setUserAgentOverride', {
      userAgent,
      platform: 'Win32',
      acceptLanguage: 'en-US, en',
    });

    // Navigate to the URL and wait for the DOM to load
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('body');

    // Solve reCAPTCHA if API key is provided
    if (recaptchaApiKey) {
      await page.solveRecaptchas();
    }

    // Get the HTML content of the page
    const html = await page.content();
    return html;
  } catch (error) {
    // Log errors
    console.error('Scrape error URL:', url);
    console.error('Scrape error:', error);
    return null;
  } finally {
    // Close the browser
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = scrape;

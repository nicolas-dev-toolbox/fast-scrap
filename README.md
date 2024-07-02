# fastScrap - JavaScript web scraping tool  

## Description

`fastScrap` is a powerful web scraping tool built using Puppeteer, designed to efficiently extract HTML content from web pages. 

It leverages various plugins to enhance performance, evade detection by websites, and handle reCAPTCHA challenges automatically. 

The tool operates in headless mode to minimize resource usage and expedite the scraping process.

## Features

- **Adblocker**: Blocks ads and trackers for faster browsing and scraping.
- **Stealth**: Evades detection by websites that block automated bots.
- **User-Agent Anonymization**: Randomizes the user-agent to simulate a regular browser.
- **Proxy Support**: Enables the use of proxies to avoid IP blocking.
- **reCAPTCHA Handling**: Automatically solves reCAPTCHA challenges using a 2Captcha API key.

## Installation

To install `fastScrap`, use npm or yarn:

```bash
npm install fastScrap
```

or

```bash
yarn add fastScrap
```

## Usage
### Basic Usage
Here's a basic example of how to use `fastScrap`:

```javascript
const scrape = require('fastScrap');

const url = 'https://example.com';

scrape({ url })
  .then((html) => {
    // Scraped HTML
    console.log(html);
  })
  .catch((error) => {
    console.error('Error scraping the page:', error);
  });
```

### Advanced Usage
`fastScrap` supports advanced options such as using a proxy and solving reCAPTCHA challenges. Here's an example:

```javascript
const scrape = require('fastScrap');

const options = {
  url: 'https://example.com',
  proxy: {
    url: 'http://proxyserver.com:8080',
    user: 'username',
    pwd: 'password',
  },
  recaptchaApiKey: 'your-2captcha-api-key',
};

scrape(options)
  .then((html) => {
    // Scraped HTML
    console.log(html);
  })
  .catch((error) => {
    console.error('Error scraping the page:', error);
  });
```



## Parameters

### Required

- `url` (string): The URL of the webpage to scrape.

### Options

| Option              | Description                                                                                                                             | Default Value |
|---------------------|-----------------------------------------------------------------------------------------------------------------------------------------|---------------|
| `proxy`             | Proxy settings including `url`, `user`, and `pwd`.                                                                                      | `undefined`   |
| `recaptchaApiKey`   | API key for solving reCAPTCHA challenges.                                                                                                | `null`        |
---

Feel free to adjust the parameters based on your application's needs. 

---

Happy scraping with `fastScrap`!


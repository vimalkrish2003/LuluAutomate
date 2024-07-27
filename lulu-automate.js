import puppeteer from 'puppeteer';
import pLimit from 'p-limit';
import { Mutex } from './mutex.js';

const LuluHyperMarketSearchPage = 'https://www.luluhypermarket.in/en-in';
const LuluHyperMarketSignInPage = 'https://www.luluhypermarket.in/en-in/login';
const LuluHyperMarketCartPage = 'https://www.luluhypermarket.in/en-in/cart'
const handleAddToCartMutex = new Mutex();

//FETCHING ITEMS
async function fetchItem(item, browser) {
  let page;
  try {
    page = await browser.newPage();
    await page.bringToFront();
    await page.goto(LuluHyperMarketSearchPage);
    await page.waitForSelector('.mobile-search-icon');
    await page.click('.mobile-search-icon');
    await page.waitForSelector('.mobileAutoCompleteSearchInput');
    await page.focus('.mobileAutoCompleteSearchInput');
    await page.type('.mobileAutoCompleteSearchInput', item);
    await page.keyboard.press('Enter');
    await page.waitForSelector('.product-box');
    const productData = await page.$eval('.product-box', el => {
      const hiddenInput = el.querySelector('input[type="hidden"][data-name][data-price]');
      return {
        name: hiddenInput.dataset.name,
        price: hiddenInput.dataset.price,
        url: "https://www.luluhypermarket.in" + el.dataset.url
      };
    });
    return productData;
  } catch (error) {
    console.error(`An error occurred while fetching item ${item}: ${error.message}`);
  } finally {
    if (page) {
      await page.close();
    }
  }
}


async function fetchItems(items) {
    const limit = pLimit(6); // Limit to 6 concurrent browsers
  
    let browsers = [];
    try {
      // Launch browsers
      browsers = await Promise.all(items.slice(0, 6).map(() => puppeteer.launch()));      //slicing till 6 to allow max 6 browsers
      // Fetch items
      const fetchPromises = items.map((item, i) => limit(async () => {
        const browser = browsers[i % browsers.length];
        return fetchItem(item, browser);
      }));
      const results = await Promise.all(fetchPromises);
      console.log('Fetched Items');
      return results;
    } catch (error) {
      console.error(`An error occurred: ${error.message}`);
    } finally {
      await Promise.all(browsers.map(browser => browser.close()));
    }
  }
  
  async function signIn(email, password, page = null, browser = null) {
    let type = 0;
    try {
      if (browser === null && page === null) {
        type = 2;
        browser = await puppeteer.launch();
        page = await browser.newPage();
      }
      else if (browser !== null && page === null) {
        type = 1;
        page = await browser.newPage();
      }
      await page.goto(LuluHyperMarketSignInPage);
      if (page.url() == LuluHyperMarketSearchPage) //Returns true if they have already signed in
        return;
      await page.waitForSelector('#emailAddress');
      await page.focus('#emailAddress');
      await page.type('#emailAddress', email);
      await page.focus('#j_password');
      await page.type('#j_password', password);
      await Promise.all([
        page.keyboard.press('Enter'),
        page.waitForNavigation(),
      ]);
    } catch (error) {
      console.error(`An error occurred while signing in: ${error.message}`);
      if (type === 1 && page !== null) {
        await page.close(); // Close the page if it was created in this function
      }
      throw error; // Re-throw the error so it can be caught and handled by the calling code
    }
    finally {
      if (type === 1 && page !== null) {
        await page.close(); // Close the page if it was created in this function
      }
      if (type === 2 && browser !== null) {
        await browser.close();
      }
  
    }
  }
  
  
  async function handleAddToCartConfirmation(page, item, noOfTries = 0) {
    try {
      await page.waitForSelector('#addToCartButton', { timeout: 5000 });
      await page.focus('#addToCartButton');
      await page.keyboard.press('Enter');
  
      // Use Promise.race to wait for either the notification or the error message
      let result = await Promise.race([
        page.waitForSelector('.addToCart-notification', { timeout: 10000 }).then(() => 'addToCartConfirmed'),
        page.waitForSelector('.cart_popup_error_msg', { timeout: 10000 }).then(() => 'outOfStock')
      ]);
  
      if (result === 'addToCartConfirmed') {
        console.log(`Item ${item.name} added to cart`);
      } else if (result === 'outOfStock') {
        const element = await page.$('.cart_popup_error_msg');
        console.log(`Sorry, ${item.name} is running out of stock. `);
        //const elementHTML = await page.evaluate(el => el.innerHTML, element);
        //console.log(`Error message: ${elementHTML}`);
      }
      else {
        console.log(`Neither the Confirmation nor the Stock running out message appeared within 10 seconds. Retrying...`)
      }
    } catch (error) {
      // If an error occurs or neither the notification nor the error message appear within 10 seconds, retry up to 3 times
      if (noOfTries < 5) {
        console.log(`Retrying to add ${item.name} to cart`);
        await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
        if (page) {
          await handleAddToCartConfirmation(page, item, noOfTries + 1);
        }
      } else {
        console.log(`Failed to add ${item.name} to cart after 5 retries`);
      }
    }
  }
  
  
  
  
  async function addItemToCart(item, browser) {
    let page;
    try {
      page = await browser.newPage();
      await page.goto(item.url, { waitUntil: 'networkidle0' });
      const notAvailableButton = await page.$('.not-available-btn');
      if (notAvailableButton) {
        console.log(`Item ${item.name} is not available`);
        return;
      }
      await handleAddToCartMutex.lock();
      try {
        await handleAddToCartConfirmation(page, item);
      } finally {
        await handleAddToCartMutex.unlock();
      }
    } catch (error) {
      console.error(`An error occurred while adding ${item.name} to cart: ${error.message}`);
    } finally {
      if (page) {
        await page.close();
      }
    }
  }
  
  
  async function clearCart(email,password,noOfTries = 0) {
    const browser = await puppeteer.launch();
    let page;
    try {
      page = await browser.newPage();
      await signIn(email, password, page);
      await page.goto(LuluHyperMarketCartPage);
      let element = await page.$('#removeAllCartGroupItems');
      while (element) {
        await Promise.all([
          page.waitForNavigation(),
          page.click('#removeAllCartGroupItems')
        ])
        element = await page.$('#removeAllCartGroupItems');
      }
    } catch (error) {
      console.error(`An error occurred while clearing cart: ${error.message}`);
      if (noOfTries < 3) {
        await clearCart(email,password,noOfTries + 1);
      }
      else {
        console.log(`Failed to clear cart after 3 retries`);
      }
    } finally {
      if (page) {
        await page.close();
      }
      await browser.close();
    }
  }
  
  
  async function addFilteredItemsToCart(email,password,filteredItems) {
    const limit = pLimit(3) //limit to 3 concurrent browsers
    let browsers = [];
    try {
      let clearCartPromise = clearCart(email,password)          //Clear cart before adding items
      browsers = await Promise.all(filteredItems.slice(0, 3).map(() => puppeteer.launch()));
      await Promise.all([...browsers.map(browser => signIn(email, password, null, browser)), clearCartPromise]);
      //Add items to cart
      const addToCartPromises = filteredItems.map((filteredItem, i) => limit(async () => {
        const browser = browsers[i % browsers.length];
        return addItemToCart(filteredItem, browser);
  
      }));
      await Promise.all(addToCartPromises);
    }
    catch (error) {
      console.error(`An error occurred in processing filtered items: ${error.message}`);
    }
    finally {
      await Promise.all(browsers.map(browser => browser.close()));
    }
  
  }
  

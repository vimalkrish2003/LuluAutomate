// api.js
import express from 'express';
import { config } from 'dotenv';
import { signIn, fetchItems,clearCart,addFilteredItemsToCart,checkout } from './lulu-automate.js'

config();
const app = express();
const port = process.env.PORT || 3000;

//middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

function validateHeaders(req, res, next) {  
    const email = req.headers['email'];
    const password = req.headers['password'];

    try {
        if (!email) {
            throw new Error('Email is required');
        }
        //validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }
        if (!password) {
            throw new Error('Password is required');
        }

        next();
    }
    catch (error) {
        res.status(400).json({error:`Header validation error: ${error.message}`});
    }
}

function validateupiID(req, res, next) {
    const upiID = req.body.upiID;
    try {
        if (!upiID) {
            throw new Error('upiID is required');
        }
        //regex
        const upiIDRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
        if (!upiIDRegex.test(upiID)) {
            throw new Error('Invalid upiID format');
        }

        next();
    }
    catch (error) {
        res.status(400).json({error:`Validation error: ${error.message}`});
    }
}
function validateCredentials(req, res, next) {
    const { email, password } = req.body;
    try {
        if (!email) {
            throw new Error('Email is required');
        }
        //validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }
        if (!password) {
            throw new Error('Password is required');
        }

        next();
    } catch (error) {
        res.status(400).json({error:`Validation error: ${error.message}`});
    }
}



//routes
/**
 * @api {get} / Welcome Message
 * @apiName GetWelcome
 * @apiGroup Root
 * @apiSuccess {String} message Welcome message.
 */
app.get('/', (req, res) => {
    res.send('Welcome to the Lulu Hypermarket API');
});

/**
 * @api {post} /signin Sign In
 * @apiName SignIn
 * @apiGroup Auth
 * @apiParam {String} email User's email.
 * @apiParam {String} password User's password.
 * @apiSuccess {String} message Sign in successful message.
 * @apiError {String} error Error message.
 */
app.post('/signin',validateCredentials, async (req, res) => {
    try {
        await signIn(req.body.email, req.body.password);
        res.status(200).json({ message: 'Sign in successful' });
    } catch (error) {
        res.status(500).json({ error: `An error occurred: ${error.message}` });
    }
});


/**
 * @api {post} /fetchItems Fetch Items
 * @apiName FetchItems
 * @apiGroup Items
 * @apiParam {String} authKey User's authentication key.
 * @apiParam {String} email User's email.
 * @apiParam {Array} items List of items to be fetched.
 * @apiSuccess {Array} items List of items with name, price, and URL.
 * @apiError {String} error Error message.
 */
app.post('/fetchItems', async (req, res) => {
    try {
        let { items } = req.body;
        // Parse items if it is a string
        if (typeof items === 'string') {
            items = JSON.parse(items);
        }
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Items array is required' });
        }
        const resultitems = await fetchItems(items);
        res.status(200).json({items:resultitems});
    } catch (error) {
        res.status(500).json({error:`An error occurred: ${error.message}`});
    }
});

/**
 * @api {post} /clearCart Clear Cart
 * @apiName ClearCart
 * @apiGroup Cart
 * @apiHeader {String} email User's email.
 * @apiHeader {String} password User's password.
 * @apiSuccess {String} message Cart cleared message.
 * @apiError {String} error Error message.
 */
app.post('/clearCart',validateHeaders, async (req, res) => {
    try {
        await clearCart(req.headers['email'], req.headers['password']);
        res.status(200).json({ message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ error: `An error occurred: ${error.message}` });
    }
});

/**
 * @api {post} /addToCart Add to Cart
 * @apiName AddToCart
 * @apiGroup Cart
 * @apiHeader {String} email User's email.
 * @apiHeader {String} password User's password.
 * @apiParam {Array} items List of items to be added to the cart received from FetchItems.
 * @apiSuccess {String} message Items added to cart message.
 * @apiError {String} error Error message.
 */
app.post('/addToCart',validateHeaders, async (req, res) => {
    try {
        let { items } = req.body;
        // Parse items if it is a string
        if (typeof items === 'string') {
            items = JSON.parse(items);
        }
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Items array is required' });
        }
        await addFilteredItemsToCart(req.headers['email'], req.headers['password'],items);
        res.status(200).json({ message: 'Items added to cart' });
    } catch (error) {
        res.status(500).json({ error: `An error occurred: ${error.message}` });
    }
});

/**
 * @api {post} /checkout Checkout
 * @apiName Checkout
 * @apiGroup Cart
 * @apiHeader {String} email User's email.
 * @apiHeader {String} password User's password.
 * @apiParam {String} upiID User's UPI ID.
 * @apiSuccess {String} message Checkout successful message.
 * @apiError {String} error Error message.
 */
app.post('/checkout',validateHeaders,validateupiID, async(req, res) => {
    try {
        await checkout(req.headers['email'], req.headers['password'],req.body.upiID);
        res.status(200).json({ message: 'Checkout successful' });
    } catch (error) {
        res.status(500).json({ error: `An error occurred: ${error.message}` });
    }
});
  
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
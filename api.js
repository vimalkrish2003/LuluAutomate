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
app.get('/', (req, res) => {
    res.send('Welcome to the Lulu Hypermarket API');
});

// parameters are email and password
// response is a token
app.post('/signin',validateCredentials, async (req, res) => {
    try {
        await signIn(req.body.email, req.body.password);
        res.status(200).json({ message: 'Sign in successful' });
    } catch (error) {
        res.status(500).json({ error: `An error occurred: ${error.message}` });
    }
});

// parameters are authKey,email and a list containing the items to be fetched from the site
// response is a list of  items with name,price,url of each item
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


app.post('/clearCart',validateHeaders, async (req, res) => {
    try {
        await clearCart(req.headers['email'], req.headers['password']);
        res.status(200).json({ message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ error: `An error occurred: ${error.message}` });
    }
});

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
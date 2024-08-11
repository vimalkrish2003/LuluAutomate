# Lulu Hypermarket Automation API

This REST API automates various functions on the Lulu Hypermarket website, from fetching items to checkout.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
  - [Welcome Message](#welcome-message)
  - [Sign In](#sign-in)
  - [Fetch Items](#fetch-items)
  - [Clear Cart](#clear-cart)
  - [Add to Cart](#add-to-cart)
  - [Checkout](#checkout)
- [License](#license)

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/vimalkrish2003/LuluAutomate.git
    cd lulu-automation
    ```

2. Install the dependencies:
    ```sh
    npm install
    ```

3. Create a `.env` file in the root directory and add your environment variables else it will use the default port 3000:
    ```env
    PORT=4000
    ```

## Usage

To start the server, run:
```sh
npm start
```

For development with hot-reloading, run:
```sh
npm run dev
```

## API Endpoints

### Welcome Message

- **Endpoint:** `GET /`
- **Description:** Returns a welcome message.
- **Response:**
  ```json
  {
    "message": "Welcome to the Lulu Hypermarket API"
  }
  ```

### Sign In

- **Endpoint:** `POST /signin`
- **Description:** Signs in a user.
- **Parameters:**
  - `email` (String): User's email.
  - `password` (String): User's password.
- **Response:**
  ```json
  {
    "message": "Sign in successful"
  }
  ```
- **Error:**
  ```json
  {
    "error": "An error occurred: <error_message>"
  }
  ```

### Fetch Items

- **Endpoint:** `POST /fetchItems`
- **Description:** Fetches a list of items.
- **Parameters:**
  - `email` (String): User's email.
  - `items` (Array): List of items to be fetched.
- **Response:**
  ```json
  {
    "items": [
      {
        "name": "Item Name",
        "price": "Item Price",
        "url": "Item URL"
      }
    ]
  }
  ```
- **Error:**
  ```json
  {
    "error": "An error occurred: <error_message>"
  }
  ```

### Clear Cart

- **Endpoint:** `POST /clearCart`
- **Description:** Clears the user's cart.
- **Headers:**
  - `email` (String): User's email.
  - `password` (String): User's password.
- **Response:**
  ```json
  {
    "message": "Cart cleared"
  }
  ```
- **Error:**
  ```json
  {
    "error": "An error occurred: <error_message>"
  }
  ```

### Add to Cart

- **Endpoint:** `POST /addToCart`
- **Description:** Adds items to the user's cart.
- **Headers:**
  - `email` (String): User's email.
  - `password` (String): User's password.
- **Parameters:**
  - `items` (Array): List of items to be added to the cart.
- **Response:**
  ```json
  {
    "message": "Items added to cart"
  }
  ```
- **Error:**
  ```json
  {
    "error": "An error occurred: <error_message>"
  }
  ```

### Checkout

- **Endpoint:** `POST /checkout`
- **Description:** Checks out the user's cart.
- **Headers:**
  - `email` (String): User's email.
  - `password` (String): User's password.
- **Parameters:**
  - `upiID` (String): User's UPI ID.
- **Response:**
  ```json
  {
    "message": "Checkout successful"
  }
  ```
- **Error:**
  ```json
  {
    "error": "An error occurred: <error_message>"
  }
  ```

## License

This project is licensed under the ISC License.

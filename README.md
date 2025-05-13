# Ethereum-Transactions-Crawler

This application allows users to search Ethereum transactions and check the balance of ETH and ERC-20 tokens on a specific date using the Etherscan API.

## Features
- Search for normal, internal, and ERC-20 transactions
- Set the starting block for the search
- Pagination of results
- Check ETH and token balances on a specific date

## Technologies
- HTML, CSS, JavaScript
- Web3.js
- Etherscan API

## Running the Application
1. Clone the repository
2. Open `index.html` in a browser
3. Enter the Ethereum address, API key, and click on "Search"

## How to Use
**Search Transactions:**
- Enter the Ethereum address (e.g., `0xaa7a9ca87d3694b5755f213b5d04094b8d0f0a6f`)
- Set the starting block (e.g., `9000000`)
- Enter your Etherscan API key
- Click on "Search"
- Transactions will be displayed in a table with pagination to navigate through the results

**Check Balance on a Specific Date:**
- In the balance check section, enter the address and the date
- Add your API key
- Click on "Check Balance"
- The system will display the ETH and ERC-20 token balances for that date

## Note
To use the application, you need a free Etherscan API key: [https://etherscan.io/apis](https://etherscan.io/apis)

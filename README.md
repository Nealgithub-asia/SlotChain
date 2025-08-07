Website: [SlotChain](https://slotchain.vercel.app/)

### **Primary Contact name and Telegram Handle**:
Thushar Kumar (@NotThushar), Anshuman Singh (@nealzballing), Harshit Chandak (@Dedsec888)

### **Team name (or write Solo)**
HAT

### **Project Title**
SlotChain

### **One-Sentence Elevator Pitch**
Our website, SlotChain, solves India's frustrating salon booking problem while making cryptocurrency a practical and simple part of daily life.

### **Detailed project description**
SlotChain is a full-stack web application designed to modernize the personal care industry by providing a centralized, online booking system for barbershops and salons. The platform, accessible at [slotchain.vercel.app](https://slotchain.vercel.app/), addresses the common inefficiency of walk-in appointments by allowing users to seamlessly find, book, and pay for grooming services in advance.

Core features of the platform include:
* **Establishment Discovery:** Users can find nearby personal care establishments by utilizing their device's location or by searching for a specific city.
* **Appointment Scheduling:** The interface enables users to select a desired service, date, and time slot, eliminating the uncertainty and wait times associated with traditional booking methods.
* **Dual Payment System:** To bridge the gap between traditional finance and Web3, SlotChain supports payments via both standard credit/debit cards and cryptocurrency, with a primary focus on Hedera (HBAR).
* **NFT Rewards:** To incentivize the adoption of cryptocurrency, every transaction completed using HBAR rewards the user with a unique, collectible Non-Fungible Token (NFT), which is then displayed in their personal dashboard.

The platform is built on a modern technology stack. The frontend was developed using HTML, TailwindCSS, and JavaScript to ensure a responsive and clean user interface. The backend relies on a secure authentication system with JSON Web Tokens (JWTs) for user management and MongoDB for data persistence.

### **Environment variables**
The application requires the following environment variables to be set up in a `.env` file for full functionality:
* `MONGO_URI`: The connection string for the MongoDB database.
* `JWT_SECRET`: The secret key for signing and verifying user authentication tokens.
* `HEDERA_ACCOUNT_ID`: The application's operational account ID on the Hedera network.
* `HEDERA_PRIVATE_KEY`: The private key required to authorize transactions on the Hedera network.

### **Usage example**
1.  A new user visits [https://slotchain.vercel.app/](https://slotchain.vercel.app/) and creates an account using the "Sign Up" button.
2.  Upon logging in, the user either allows the site to access their location or uses the search bar to find salons in a specific city.
3.  From the list of available stations, the user selects one and clicks "Book Now."
4.  In the booking modal, they choose a service, a date, and an available time.
5.  At checkout, the user is presented with payment options: Hedera HBAR or credit/debit card. They select HBAR to receive the NFT reward.
6.  The transaction is completed, and the booking is confirmed.
7.  The user can then navigate to their "Dashboard" to view the details of their upcoming appointment and see the newly awarded NFT in their collection.

### **Known issues**
* **Crypto Payments:** Direct integration with Hedera HBAR was challenging that are mentioned below, so we currently use a third-party site to process crypto transactions.

    -- HashConnect is not defined & Wallet Initialization Errors:This was the most persistent issue. The application's main script was trying to use the HashConnect library before the browser had finished loading it. It also caused the wallet connection modal to not appear and made the site unresponsive.

    -- Unexpected token 'T', "The page c"... is not valid JSON:This error occurred when the frontend tried to get payment information from the backend. The frontend was expecting a JSON response but was receiving an HTML error page instead (likely a "404 Not Found" page from the server).

    -- Invalid or expired token

    -- HashConnect not initialized:This error was a direct result of the timing issue mentioned above, but it manifested differently. Even if the HashConnect library was loaded, the user could still click the "Connect Wallet" button before our initHashConnect() function had completed its own setup process (which is asynchronous).

    -- ReferenceError: HashConnect is not defined: The main part of our application's JavaScript code was trying to use the HashConnect library before the browser had finished downloading and loading it from the unpkg.com server
* **NFT Minting:** As a result of the payment workaround, the NFT reward system is implemented as a demonstration to show how the NFTs will be stored and displayed in the user's dashboard.
* **Location Services:** We encountered issues with the Google API for finding nearby shops, so the platform currently uses a mock data set for demonstration purposes.
* **Minor UI/Styling Issues**: We encountered a few smaller issues where logos were not displaying correctly, and buttons in the payment modals were not styled properly on hover, especially in dark mode.

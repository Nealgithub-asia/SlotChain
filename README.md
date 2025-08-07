# SlotChain

**Secure blockchain-powered bookings with crypto payments and exclusive NFT rewards.**

**Live Project URL:** [https://slotchain.vercel.app/](https://slotchain.vercel.app/)

---

### **Project Overview**

* **Elevator Pitch:** Our website, SlotChain, solves India's frustrating salon booking problem while making cryptocurrency a practical and simple part of daily life.

* **Description:**
    SlotChain is a full-stack web application that allows users to book appointments at local barbershops and salons online. Our platform addresses the common inefficiency of walk-in appointments by enabling users to find establishments via geolocation or city search, select a service, and book a specific time slot—eliminating guesswork and long waits.

    A core feature is our dual payment system, which accepts both traditional credit/debit cards and cryptocurrency (primarily Hedera HBAR). To incentivize crypto adoption, users who pay with HBAR receive a collectible NFT, which is visible in their personal dashboard. The frontend is built with HTML, TailwindCSS, and JavaScript for a clean user experience, backed by a secure authentication system using JWTs and a MongoDB database for storing all user and booking information.

---

### **Team & Contact Information**

* **Team Name:** HAT
* **Contact Details:**
    * Harshit Chandak (@Dedsec888)
    * Anshuman Singh (@nealzballing)
    * Thushar Kumar (@NotThushar)

---

### **Technical Details**

* **Required Environment Variables:**
    * `MONGO_URI`
    * `JWT_SECRET`
    * `HEDERA_ACCOUNT_ID`
    * `HEDERA_PRIVATE_KEY`
    * `CHAINGPT_API_KEY`

---

### **Usage Example**

1.  **Visit the website:** Navigate to [https://slotchain.vercel.app/](https://slotchain.vercel.app/).
2.  **Sign Up/Login:** Create a new account or log in to an existing one.
3.  **Find a Station:** Use the search controls to find grooming stations by city or by enabling location services.
4.  **Select & Book:** Browse the list of available stations and click "Book Now" on your preferred choice.
5.  **Schedule:** In the booking modal, select a service, date, and an available time slot.
6.  **Payment:** Proceed to the payment step and choose between Hedera HBAR (to receive an NFT reward) or a traditional credit/debit card.
7.  **Complete:** Finalize the transaction to confirm your booking.
8.  **View Dashboard:** After booking, navigate to your dashboard to view upcoming appointments, booking history, and your NFT collection.

---

### **Known Issues & Limitations**

* **Crypto Payments:** Direct integration with Hedera HBAR was challenging, so we currently use a third-party site to process crypto transactions.
* **NFT Minting:** As a result of the payment workaround, the NFT reward system is implemented as a demonstration to show how the NFTs will be stored and displayed in the user's dashboard.
* **Location Services:** We encountered issues with the Google API for finding nearby shops, so the platform currently uses a mock data set for demonstration purposes.

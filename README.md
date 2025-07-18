# 🚀 Days Count Down: Your Brutal Accountability Partner

<p align="center">
  <img src="https/raw.githubusercontent.com/your-username/your-repo-name/main/public/dcd-logo.svg" alt="DCD Logo" width="200"/>
</p>

<p align="center">
  <strong>Stop making excuses. Stop negotiating with "tomorrow."</strong>
  <br />
  Your goals aren't suggestions—they are demands, and this app is the drill sergeant that will ensure you listen.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
</p>

---

## ✨ Key Features

Days Count Down is a relentless tool designed to force you to confront your deadlines and execute on your ambitions.

* **🔥 Brutal Countdown Timers:** A massive, visually dominant countdown for your primary mission. It's not just tracking days; it's a constant reminder that the clock is ticking.
* **🤖 Interactive AI Coach:** Feeling stuck? Vent your frustrations to a witty, tough-love AI assistant. It will analyze your feelings and, when necessary, propose a revised, more manageable plan to get you back on track.
* **🎯 Multi-Mission Management:** Create, edit, and prioritize multiple missions. Set deadlines, categories, and priority levels from "Low" to "EXTREME."
* **📈 AI-Powered Roadmap Generation:** Define a goal, and our AI will instantly generate a detailed, day-by-day roadmap with specific, actionable tasks and difficulty ratings.
* **🔐 Secure User Authentication:** Full user authentication system with email/password sign-up and login. All your missions, roadmaps, and chats are private and tied to your account.
* **👤 User Profile Management:** Easily update your display name and change your password from a secure profile page.
* **🎨 Stunning Neon-Cyberpunk UI:** A visually immersive interface built with Tailwind CSS, featuring custom neon effects, gradients, and animations that make accountability feel powerful.

---

## 🛠️ Technology Stack

This project is built with a modern, robust, and scalable tech stack:

* **Framework:** [React](https://react.dev/) via [Vite](https://vitejs.dev/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/) components
* **Backend & Database:** [Firebase](https://firebase.google.com/) (Firestore & Authentication)
* **AI:** [Google Gemini API](https://ai.google.dev/)
* **Routing:** [React Router](https://reactrouter.com/)
* **Linting:** [ESLint](https://eslint.org/)

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You need to have [Node.js](https://nodejs.org/) (version 18.0 or higher) and `npm` installed on your machine.

### Installation & Setup

1.  **Clone the Repository:**
    ```sh
    git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
    cd your-repo-name
    ```

2.  **Install NPM Packages:**
    This will install all the necessary dependencies for the project.
    ```sh
    npm install
    ```

3.  **Set Up Environment Variables:**
    Create a file named `.env.local` in the root of your project and add your Firebase and Gemini API keys.
    ```env
    VITE_GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    VITE_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
    VITE_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    VITE_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    VITE_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
    VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
    VITE_FIREBASE_APP_ID="YOUR_APP_ID"
    ```

4.  **Run the Development Server:**
    This command will start the application on `http://localhost:8080`.
    ```sh
    npm run dev
    ```

---

## 🚢 Deployment

You have multiple options for deploying this application for free.

### Recommended: Vercel or Netlify

1.  **Build the Project:**
    ```sh
    npm run build
    ```
    This creates an optimized `dist` folder.

2.  **Import to a Hosting Provider:**
    * Sign up for a free account on [Vercel](https://vercel.com) or [Netlify](https://www.netlify.com/).
    * Connect your GitHub repository.
    * Configure the build settings:
        * **Build Command:** `npm run build`
        * **Output Directory:** `dist`
    * Add your environment variables from `.env.local` to the platform's settings.

3.  **Deploy!** Your application will be live on the internet.

---

## 📜 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

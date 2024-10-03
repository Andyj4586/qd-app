// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDeLI4maukn1eyoJ6X3zyhElN8MFKKYBIE",
  authDomain: "queued-6a1d3.firebaseapp.com",
  projectId: "queued-6a1d3",
  storageBucket: "queued-6a1d3.appspot.com",
  messagingSenderId: "46644652922",
  appId: "1:46644652922:web:7bb4a5c2f906ae2a84c4c3",
  measurementId: "G-M45DS41DFY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Export the services
export { auth, db };
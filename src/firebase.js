import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyAcj0BtjSzS1SdlerMJcju4hTy6krHKk5M",
  authDomain: "term-ya-icu-a-34631.firebaseapp.com",
  projectId: "term-ya-icu-a-34631",
  storageBucket: "term-ya-icu-a-34631.firebasestorage.app",
  messagingSenderId: "64034271765",
  appId: "1:64034271765:web:c9355a73210e560a16141c",
  measurementId: "G-H5M81WCZ7R"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export default app

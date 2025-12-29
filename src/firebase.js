import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDDNYlSKPd1Eef8FWCgphONTgWnw9-csrI",
    authDomain: "jtg-journal.firebaseapp.com",
    projectId: "jtg-journal",
    storageBucket: "jtg-journal.firebasestorage.app",
    messagingSenderId: "1051515355764",
    appId: "1:1051515355764:web:0c6c6f7417cb22b44e4721"
};

try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
} catch (e) {
    console.error("Firebase initialization error", e);
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export default firebase;

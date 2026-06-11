import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithPopup, 
    signOut, 
    GoogleAuthProvider 
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    addDoc, 
    query, 
    where, 
    writeBatch 
} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDDNYlSKPd1Eef8FWCgphONTgWnw9-csrI",
    authDomain: "jtg-journal.firebaseapp.com",
    projectId: "jtg-journal",
    storageBucket: "jtg-journal.firebasestorage.app",
    messagingSenderId: "1051515355764",
    appId: "1:1051515355764:web:0c6c6f7417cb22b44e4721"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const rawAuth = getAuth(app);
const rawDb = getFirestore(app);

// Simple document snapshot mapper
class DocSnapshotCompat {
    constructor(snap) {
        this._snap = snap;
        this.exists = snap.exists();
        this.id = snap.id;
        this.ref = new DocRefCompat(snap.ref);
    }
    data() {
        return this._snap.data();
    }
}

// Simple query snapshot mapper
class QuerySnapshotCompat {
    constructor(snap) {
        this.docs = snap.docs.map(d => new DocSnapshotCompat(d));
    }
}

// Document reference compat wrapper
class DocRefCompat {
    constructor(ref) {
        this._ref = ref;
        this.id = ref.id;
    }
    async get() {
        const snap = await getDoc(this._ref);
        return new DocSnapshotCompat(snap);
    }
    async set(data, options = {}) {
        return await setDoc(this._ref, data, options);
    }
    async update(data) {
        return await updateDoc(this._ref, data);
    }
    async delete() {
        return await deleteDoc(this._ref);
    }
}

// Collection / Query compat wrapper
class CollectionCompat {
    constructor(colRefOrQuery, isQuery = false, qConstraints = []) {
        this._refOrQuery = colRefOrQuery;
        this._isQuery = isQuery;
        this._qConstraints = qConstraints;
    }
    doc(docId) {
        if (this._isQuery) throw new Error("doc() cannot be called on a query");
        return new DocRefCompat(doc(this._refOrQuery, docId));
    }
    where(field, op, val) {
        const newConstraint = where(field, op, val);
        const nextConstraints = [...this._qConstraints, newConstraint];
        const source = this._isQuery ? this._refOrQuery.source : this._refOrQuery;
        const q = query(source, ...nextConstraints);
        q.source = source;
        return new CollectionCompat(q, true, nextConstraints);
    }
    async add(data) {
        if (this._isQuery) throw new Error("add() cannot be called on a query");
        const docRef = await addDoc(this._refOrQuery, data);
        return new DocRefCompat(docRef);
    }
    async get() {
        const snap = await getDocs(this._refOrQuery);
        return new QuerySnapshotCompat(snap);
    }
}

// Batch compat wrapper
class BatchCompat {
    constructor(batch) {
        this._batch = batch;
    }
    set(docRefCompat, data, options = {}) {
        this._batch.set(docRefCompat._ref, data, options);
        return this;
    }
    update(docRefCompat, data) {
        this._batch.update(docRefCompat._ref, data);
        return this;
    }
    delete(docRefCompat) {
        this._batch.delete(docRefCompat._ref);
        return this;
    }
    async commit() {
        return await this._batch.commit();
    }
}

// Auth compat wrapper
class AuthCompat {
    constructor(auth) {
        this._auth = auth;
    }
    get currentUser() {
        return this._auth.currentUser;
    }
    onAuthStateChanged(callback) {
        return onAuthStateChanged(this._auth, callback);
    }
    async signInWithPopup(provider) {
        return await signInWithPopup(this._auth, provider._provider);
    }
    async signOut() {
        return await signOut(this._auth);
    }
}

class GoogleAuthProviderCompat {
    constructor() {
        this._provider = new GoogleAuthProvider();
    }
}

// Firestore compat wrapper
class FirestoreCompat {
    constructor(db) {
        this._db = db;
    }
    collection(colName) {
        return new CollectionCompat(collection(this._db, colName));
    }
    batch() {
        return new BatchCompat(writeBatch(this._db));
    }
}

// Export compat variables
export const auth = new AuthCompat(rawAuth);
export const db = new FirestoreCompat(rawDb);

const firebaseCompat = {
    auth: () => auth,
    firestore: () => db
};

// Map inner properties for auth provider
firebaseCompat.auth.GoogleAuthProvider = GoogleAuthProviderCompat;

export default firebaseCompat;

import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';

// Firebase アプリが未初期化なら初期化
const firebaseApp = getApps().length === 0 ? initializeApp() : getApp();

const db = getFirestore();
const storage = getStorage();
const auth = getAuth();

export { firebaseApp, db, storage, auth };
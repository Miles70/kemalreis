import { getApp, getApps, initializeApp } from "firebase/app";
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBOEaktyL9CwDomZuZBK-W7f8ZQoTAloTI",
  authDomain: "gabaloo-219b1.firebaseapp.com",
  projectId: "gabaloo-219b1",
  storageBucket: "gabaloo-219b1.firebasestorage.app",
  messagingSenderId: "427482712446",
  appId: "1:427482712446:web:7f37bddc4e69f8b6e70b2f",
  measurementId: "G-9LNK6DK1F5",
};

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);
export const firebaseAuthReady = setPersistence(
  firebaseAuth,
  browserLocalPersistence,
).catch(() => undefined);

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: "select_account",
});

export const facebookAuthProvider = new FacebookAuthProvider();
facebookAuthProvider.addScope("email");

export const appleAuthProvider = new OAuthProvider("apple.com");
appleAuthProvider.addScope("email");
appleAuthProvider.addScope("name");

export const firebaseProviderAvailability = {
  google: true,
  facebook: false,
  apple: false,
};

export default firebaseApp;

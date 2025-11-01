"use client";
import React from "react";
import { useAuth } from "./AuthProvider";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { app as getApp } from "../firebaseClient";

export default function SignInButton() {
  const { user, loading } = useAuth();

  const handleSignIn = async () => {
    if (typeof window === 'undefined') return;
    const auth = getAuth(getApp());
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleSignOut = async () => {
    if (typeof window === 'undefined') return;
    const auth = getAuth(getApp());
    await signOut(auth);
  };

  if (loading) return null;
  if (user) {
    return (
      <button
        className="px-4 py-2 rounded-full bg-indigo-500 text-white font-semibold shadow hover:bg-indigo-600 transition"
        onClick={handleSignOut}
      >
        Sign Out
      </button>
    );
  }
  return (
    <button
      className="px-4 py-2 rounded-full bg-indigo-500 text-white font-semibold shadow hover:bg-indigo-600 transition"
      onClick={handleSignIn}
    >
      Sign In
    </button>
  );
}

import { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, query, orderBy, Timestamp } from "firebase/firestore";
import { db as getDb } from "../firebaseClient";

export type GardenTree = {
  id: string;
  x: number;
  y: number;
  color: string;
  mood: string;
  createdAt: Timestamp;
};

export function useGarden() {
  const [trees, setTrees] = useState<GardenTree[]>([]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = query(collection(getDb(), "grove-trees"), orderBy("createdAt"));
    const unsub = onSnapshot(q, (snap) => {
      setTrees(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as GardenTree))
      );
    });
    return () => unsub();
  }, []);
  return trees;
}

export async function plantTree({ x, y, color, mood }: Omit<GardenTree, "id" | "createdAt">) {
  if (typeof window === 'undefined') return;
  await addDoc(collection(getDb(), "grove-trees"), {
    x,
    y,
    color,
    mood,
    createdAt: Timestamp.now(),
  });
}

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export const addHealthGoal = async (user, title, category, target) => {
  try {
    await addDoc(collection(db, "users", user.uid, "healthGoals"), {
      title,
      category, 
      target, 
      completed: false,
      createdAt: new Date(),
    });
    console.log("Health goal i ri u shtua!");
  } catch (error) {
    console.log("Gabim gjatë shtimit:", error.message);
    throw error;
  }
};

export const loadHealthGoals = (user, setGoals) => {
  const goalsRef = collection(db, "users", user.uid, "healthGoals");
  const q = query(goalsRef, orderBy("createdAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    const goals = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    setGoals(goals);
  });
};

export const updateHealthGoal = async (user, goalId, updatedData) => {
  try {
    await updateDoc(
      doc(db, "users", user.uid, "healthGoals", goalId),
      updatedData
    );
    console.log("Health goal u përditësua!");
  } catch (error) {
    console.log("Gabim gjatë përditësimit:", error.message);
    throw error;
  }
};

export const deleteHealthGoal = async (user, goalId) => {
  try {
    await deleteDoc(doc(db, "users", user.uid, "healthGoals", goalId));
    console.log("Health goal u fshi!");
  } catch (error) {
    console.log("Gabim gjatë fshirjes:", error.message);
    throw error;
  }
};

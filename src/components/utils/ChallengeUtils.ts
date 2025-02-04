import { collection, getDocs } from "firebase/firestore";
import { db } from '../../firebase/firebase';

export const fetchChallengesFromFirestore = async () => {
  const challengesSnapshot = await getDocs(collection(db, "challenges"));
  const challengesList = challengesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return challengesList;
};

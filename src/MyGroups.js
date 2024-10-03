import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Link } from 'react-router-dom';

function MyGroups() {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // Query Firestore for groups the user is part of
      const groupsRef = collection(db, 'groups');
      const q = query(groupsRef, where('members', 'array-contains', user.uid));
      const querySnapshot = await getDocs(q);

      const userGroups = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGroups(userGroups);
    };

    fetchGroups();
  }, []);

  return (
    <div>
      <h2>My Groups</h2>
      <ul>
        {groups.map(group => (
          <li key={group.id}>
            <Link to={`/groups/${group.id}`}>{group.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MyGroups;
// Home.js
import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, updateDoc, arrayUnion, onSnapshot, getDoc } from 'firebase/firestore';
import GroupQueue from './GroupQueue'; // Ensure GroupQueue is properly imported

function Home() {
  const [queue, setQueue] = useState([]);
  const [name, setName] = useState('');
  const [service, setService] = useState('');
  const [error, setError] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // Fetch the user's queue and groups when the component mounts
  useEffect(() => {
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          setQueue(docSnap.data().queue || []);
          const userGroups = docSnap.data().groups || [];

          // Fetch group details (e.g., names) based on group IDs
          const groupPromises = userGroups.map(async (groupId) => {
            const groupDoc = await getDoc(doc(db, 'groups', groupId));
            if (groupDoc.exists()) {
              return { id: groupId, name: groupDoc.data().name };
            } else {
              return { id: groupId, name: 'Unknown Group' };
            }
          });

          const groupsData = await Promise.all(groupPromises);
          setGroups(groupsData);
        }
      });
      return unsubscribe;
    }
  }, []);

  // Add item to user's personal queue
  const addItem = async (e) => {
    e.preventDefault();
    if (!name.trim() || !service.trim()) {
      setError('Please enter both name and service');
      return;
    }

    try {
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDoc, {
        queue: arrayUnion({
          id: new Date().getTime().toString(), // Unique ID for the item
          name: name.trim(),
          service: service.trim(),
          // addedAt: new Date(), // Removed as per requirement
        }),
      });
      setName('');
      setService('');
      setError('');
    } catch (error) {
      console.error('Error adding item to queue:', error);
      setError('Could not add item.');
    }
  };

  // Mark an item as watched by the current user
  const markAsWatched = async (itemId) => {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);

    try {
      await updateDoc(userDocRef, {
        watchedQueueItems: arrayUnion(itemId),
      });
      console.log(`Item ${itemId} marked as watched.`);
    } catch (error) {
      console.error('Error marking item as watched:', error);
      setError('Could not mark item as watched.');
    }
  };

  // Handle group selection
  const handleGroupSelect = (e) => {
    const groupId = e.target.value;
    setSelectedGroupId(groupId);
  };

  return (
    <div style={styles.container}>
      <h1>Q'd</h1>
      <h2>Your Queue</h2>
      {error && <p style={styles.error}>{error}</p>}
      <form onSubmit={addItem} style={styles.form}>
        <input
          type="text"
          placeholder="Item Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
        />
        <input
          type="text"
          placeholder="Service (e.g., Netflix, Hulu)"
          value={service}
          onChange={(e) => setService(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Add to Queue
        </button>
      </form>

      <ul style={styles.ul}>
        {queue.map((item) => (
          <li key={item.id} style={styles.li}>
            <div>
              <strong>{item.name}</strong> on <em>{item.service}</em>
            </div>
            <button onClick={() => markAsWatched(item.id)} style={styles.button}>
              Mark as Watched
            </button>
          </li>
        ))}
      </ul>

      {/* Group Selection */}
      <div style={styles.groupSelection}>
        <h2>Your Groups</h2>
        {groups.length > 0 ? (
          <select onChange={handleGroupSelect} value={selectedGroupId || ''} style={styles.select}>
            <option value="" disabled>
              Select a group
            </option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        ) : (
          <p>You are not part of any groups. Create or join a group to share queues.</p>
        )}
      </div>

      {/* Render Group Queue component if a group is selected */}
      {selectedGroupId && <GroupQueue groupId={selectedGroupId} markAsWatched={markAsWatched} />}
    </div>
  );
}

// Shared styles
const styles = {
  container: {
    maxWidth: '600px',
    margin: '30px auto',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    backgroundColor: '#fff',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '20px',
  },
  input: {
    padding: '10px',
    marginBottom: '15px',
    borderRadius: '3px',
    border: '1px solid #ccc',
    fontSize: '16px',
  },
  button: {
    padding: '10px',
    borderRadius: '3px',
    border: 'none',
    backgroundColor: '#333',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '5px',
  },
  ul: {
    listStyle: 'none',
    padding: 0,
  },
  li: {
    padding: '10px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  error: {
    color: 'red',
  },
  groupSelection: {
    marginTop: '30px',
  },
  select: {
    padding: '10px',
    borderRadius: '3px',
    border: '1px solid #ccc',
    fontSize: '16px',
    width: '100%',
  },
};

export default Home;
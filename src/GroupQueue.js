// GroupQueue.js
import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore'; // Removed serverTimestamp
import PropTypes from 'prop-types'; // Optional: For prop type checking

const GroupQueue = ({ groupId, markAsWatched }) => {
  // 1. Declare all Hooks at the top level
  const [queue, setQueue] = useState([]);
  const [watchedItems, setWatchedItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemService, setNewItemService] = useState('');
  const [error, setError] = useState('');

  // 2. Fetch data using useEffect
  useEffect(() => {
    if (!groupId) {
      // Optionally handle the case where groupId is not provided
      setError('Invalid group ID.');
      return;
    }

    // Listen for changes to the group's queue
    const groupDocRef = doc(db, 'groups', groupId);
    const unsubscribeGroup = onSnapshot(
      groupDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setQueue(docSnap.data().queue || []);
        } else {
          setError('Group does not exist.');
        }
      },
      (error) => {
        console.error('Error fetching group queue:', error);
        setError('Failed to load shared queue.');
      }
    );

    // Listen for changes to the user's watched items
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribeUser = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setWatchedItems(docSnap.data().watchedQueueItems || []);
        } else {
          setError('User data not found.');
        }
      },
      (error) => {
        console.error('Error fetching user data:', error);
        setError('Failed to load user data.');
      }
    );

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeGroup();
      unsubscribeUser();
    };
  }, [groupId]);

  // 3. Handler to add items to the shared queue
  const addSharedItem = async (e) => {
    e.preventDefault();
    setError('');

    if (!newItemName.trim() || !newItemService.trim()) {
      setError('Please enter both name and service.');
      return;
    }

    try {
      const groupDocRef = doc(db, 'groups', groupId);
      await updateDoc(groupDocRef, {
        queue: arrayUnion({
          id: new Date().getTime().toString(), // Unique ID for the item
          name: newItemName.trim(),
          service: newItemService.trim(),
          // addedAt: serverTimestamp(), // Removed as per requirement
        }),
      });
      console.log('Item added to shared queue successfully.');
      setNewItemName('');
      setNewItemService('');
      setError('');
    } catch (error) {
      console.error('Error adding item to shared queue:', error);
      if (error.code === 'permission-denied') {
        setError('You do not have permission to add items to this shared queue.');
      } else {
        setError(`Could not add item to shared queue. ${error.message}`);
      }
    }
  };

  // 4. Filter out items the user has already watched
  const filteredQueue = queue.filter((item) => !watchedItems.includes(item.id));

  return (
    <div style={styles.container}>
      <h2>Shared Queue</h2>
      {error && <p style={styles.error}>{error}</p>}
      <form onSubmit={addSharedItem} style={styles.form}>
        <input
          type="text"
          placeholder="Item Name"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          style={styles.input}
        />
        <input
          type="text"
          placeholder="Service (e.g., Netflix, Hulu)"
          value={newItemService}
          onChange={(e) => setNewItemService(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Add to Shared Queue
        </button>
      </form>

      <ul style={styles.ul}>
        {filteredQueue.map((item) => (
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
    </div>
  );
};

// Optional: Define prop types for better type checking
GroupQueue.propTypes = {
  groupId: PropTypes.string.isRequired,
  markAsWatched: PropTypes.func.isRequired,
};

// Shared styles
const styles = {
  container: {
    marginTop: '20px',
    padding: '15px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '15px',
  },
  input: {
    padding: '8px',
    marginBottom: '10px',
    borderRadius: '3px',
    border: '1px solid #ccc',
    fontSize: '14px',
  },
  button: {
    padding: '8px',
    borderRadius: '3px',
    border: 'none',
    backgroundColor: '#007BFF',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
  },
  ul: {
    listStyle: 'none',
    padding: 0,
  },
  li: {
    padding: '8px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  error: {
    color: 'red',
  },
};

export default GroupQueue;
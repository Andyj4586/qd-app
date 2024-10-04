// Home.js
import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, updateDoc, arrayUnion, onSnapshot, getDoc } from 'firebase/firestore';
import GroupQueue from './GroupQueue';
import axios from 'axios'; // Import Axios
import QueueItem from './QueueItem'; // Import QueueItem component

function Home() {
  const [queue, setQueue] = useState([]);
  const [watchedQueueItems, setWatchedQueueItems] = useState([]); // New state for watched items
  const [name, setName] = useState('');
  const [service, setService] = useState('');
  const [error, setError] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  
  // State variables for sorting and filtering
  const [sortOption, setSortOption] = useState('dateDesc'); // Default: Newest first
  const [filterService, setFilterService] = useState('all'); // Default: Show all services

  // Fetch the user's queue, watched items, and groups when the component mounts
  useEffect(() => {
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          setQueue(docSnap.data().queue || []);
          setWatchedQueueItems(docSnap.data().watchedQueueItems || []); // Fetch watched items
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

    setError(''); // Clear previous errors

    try {
      // Fetch data from OMDb API
      const response = await axios.get(`https://www.omdbapi.com/`, {
        params: {
          t: name.trim(),
          apikey: process.env.REACT_APP_OMDB_API_KEY,
        },
      });

      if (response.data.Response === 'False') {
        setError('Title not found. Please check the name and try again.');
        return;
      }

      const { Poster, Plot } = response.data;

      // Update Firestore with the new queue item
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDoc, {
        queue: arrayUnion({
          id: new Date().getTime().toString(), // Unique ID for the item
          name: name.trim(),
          service: service.trim(),
          poster: Poster !== 'N/A' ? Poster : '', // Handle missing posters
          description: Plot !== 'N/A' ? Plot : 'No description available.',
          addedAt: new Date(), // Keep addedAt for sorting
        }),
      });
      setName('');
      setService('');
      setError('');
    } catch (error) {
      console.error('Error adding item to queue:', error);
      setError('Could not add item. Please try again.');
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

  // Extract unique streaming services for filtering
  const uniqueServices = [...new Set(queue.map(item => item.service))].filter(service => service);

  // Create a derived queue based on sorting and filtering, excluding watched items
  const displayedQueue = [...queue]
    .filter((item) => {
      const serviceMatch = filterService === 'all' || item.service === filterService;
      const notWatched = !watchedQueueItems.includes(item.id);
      return serviceMatch && notWatched;
    })
    .sort((a, b) => {
      if (sortOption === 'dateAsc') {
        return new Date(a.addedAt) - new Date(b.addedAt); // Oldest first
      } else if (sortOption === 'dateDesc') {
        return new Date(b.addedAt) - new Date(a.addedAt); // Newest first
      } else if (sortOption === 'serviceAsc') {
        return a.service.localeCompare(b.service);
      } else if (sortOption === 'serviceDesc') {
        return b.service.localeCompare(a.service);
      }
      return 0;
    });

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
          required
        />
        <input
          type="text"
          placeholder="Service (e.g., Netflix, Hulu)"
          value={service}
          onChange={(e) => setService(e.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.button}>
          Add to Queue
        </button>
      </form>

      {/* Sorting and Filtering Controls */}
      <div style={styles.controlsContainer}>
        <div style={styles.control}>
          <label htmlFor="sort" style={styles.label}>Sort By:</label>
          <select
            id="sort"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            style={styles.select}
          >
            <option value="dateDesc">Date Added (Newest)</option>
            <option value="dateAsc">Date Added (Oldest)</option>
            <option value="serviceAsc">Streaming Service (A-Z)</option>
            <option value="serviceDesc">Streaming Service (Z-A)</option>
          </select>
        </div>
        <div style={styles.control}>
          <label htmlFor="filter" style={styles.label}>Filter By Service:</label>
          <select
            id="filter"
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Services</option>
            {uniqueServices.map((service, index) => (
              <option key={index} value={service}>{service}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Horizontally Scrollable Queue */}
      <div style={styles.queueContainer}>
        {displayedQueue.map((item) => (
          <QueueItem key={item.id} item={item} markAsWatched={markAsWatched} />
        ))}
      </div>

      {/* Group Selection */}
      <div style={styles.groupSelection}>
        <h2>Your Groups</h2>
        {groups.length > 0 ? (
          <select onChange={handleGroupSelect} value={selectedGroupId || ''} style={styles.select}>
            <option value="" disabled>Select a group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
        ) : (
          <p>You are not part of any groups. Create or join a group to share queues.</p>
        )}
      </div>

      {/* Render Group Queue component if a group is selected */}
      {selectedGroupId && (
        <GroupQueue groupId={selectedGroupId} markAsWatched={markAsWatched} />
      )}
    </div>
  );

}

// Shared styles
const styles = {
  container: {
    maxWidth: '800px',
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
  controlsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  control: {
    display: 'flex',
    flexDirection: 'column',
    width: '48%',
  },
  label: {
    marginBottom: '5px',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  select: {
    padding: '8px',
    borderRadius: '3px',
    border: '1px solid #ccc',
    fontSize: '14px',
  },
  queueContainer: {
    display: 'flex',
    overflowX: 'auto',
    paddingBottom: '10px',
  },
  groupSelection: {
    marginTop: '30px',
  },
  error: {
    color: 'red',
  },
  // Additional styles for QueueItem are in QueueItem.js
};

export default Home;
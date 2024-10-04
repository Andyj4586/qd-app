// GroupQueue.js
import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import axios from 'axios'; // Import Axios
import QueueItem from './QueueItem'; // Reuse the existing QueueItem component
import './GroupQueue.css'; // Import GroupQueue.css

const GroupQueue = ({ groupId, markAsWatched }) => {
  const [queue, setQueue] = useState([]);
  const [watchedItems, setWatchedItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemService, setNewItemService] = useState('');
  const [error, setError] = useState('');
  const [groupName, setGroupName] = useState(''); // New state for group name

  // Define the available streaming services
  const streamingServices = [
    'Netflix',
    'Hulu',
    'Disney+',
    'AppleTV+',
    'Paramount+',
    'Max',
    'Amazon Prime',
  ];

  useEffect(() => {
    if (!groupId) {
      setError('Invalid group ID.');
      return;
    }

    const groupDocRef = doc(db, 'groups', groupId);
    const unsubscribeGroup = onSnapshot(
      groupDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const groupData = docSnap.data();
          setQueue(Array.isArray(groupData.queue) ? groupData.queue : []);
          setGroupName(groupData.name || 'Unknown Group'); // Set group name

          if (!Array.isArray(groupData.queue)) {
            console.warn(`Group ${groupId} has an invalid 'queue' field. Expected an array.`);
          }
        } else {
          setError('Group does not exist.');
          setQueue([]);
          setGroupName('');
        }
      },
      (error) => {
        console.error('Error fetching group queue:', error);
        setError('Failed to load shared queue.');
      }
    );

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

    return () => {
      unsubscribeGroup();
      unsubscribeUser();
    };
  }, [groupId]);

  // Function to add an item to the shared queue
  const addSharedItem = async (e) => {
    e.preventDefault();
    setError('');

    if (!newItemName.trim() || !newItemService.trim()) {
      setError('Please enter both name and service');
      return;
    }

    try {
      // Fetch data from OMDb API
      const response = await axios.get('https://www.omdbapi.com/', {
        params: {
          t: newItemName.trim(),
          apikey: process.env.REACT_APP_OMDB_API_KEY,
        },
      });

      if (response.data.Response === 'False') {
        setError('Title not found. Please check the name and try again.');
        return;
      }

      const { Poster, Plot } = response.data;

      // Update Firestore with the new queue item
      const groupDocRef = doc(db, 'groups', groupId);
      await updateDoc(groupDocRef, {
        queue: arrayUnion({
          id: new Date().getTime().toString(), // Unique ID for the item
          name: newItemName.trim(),
          service: newItemService.trim(),
          poster: Poster !== 'N/A' ? Poster : '', // Handle missing posters
          description: Plot !== 'N/A' ? Plot : 'No description available.',
          addedAt: new Date(), // Keep addedAt for sorting
        }),
      });

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

  // Function to format the group name
  const formatPossessive = (name) => {
    if (!name) return "Group Q";
    return `${name} Q`;
  };

  // Filter out watched items
  const filteredQueue = queue.filter((item) => !watchedItems.includes(item.id));

  // Extract unique streaming services for filtering
  const uniqueServices = [
    ...new Set(filteredQueue.map((item) => item.service))
  ].filter((service) => service);

  // State for sorting and filtering
  const [sortOptionGroup, setSortOptionGroup] = useState('dateDesc'); // Default: Newest first
  const [filterServiceGroup, setFilterServiceGroup] = useState('all'); // Default: Show all services

  // Create a derived queue based on sorting and filtering
  const displayedQueue = [...filteredQueue]
    .filter((item) => filterServiceGroup === 'all' || item.service === filterServiceGroup)
    .sort((a, b) => {
      if (sortOptionGroup === 'dateAsc') {
        return new Date(a.addedAt) - new Date(b.addedAt); // Oldest first
      } else if (sortOptionGroup === 'dateDesc') {
        return new Date(b.addedAt) - new Date(a.addedAt); // Newest first
      } else if (sortOptionGroup === 'serviceAsc') {
        return a.service.localeCompare(b.service);
      } else if (sortOptionGroup === 'serviceDesc') {
        return b.service.localeCompare(a.service);
      }
      return 0;
    });

  return (
    <div className="groupQueueContainer">
      <h2>{formatPossessive(groupName)}</h2> {/* Dynamic Header */}
      {error && <p className="error">{error}</p>}
      <form onSubmit={addSharedItem} className="form">
        <input
          type="text"
          placeholder="Item Name"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="input"
          required
        />
        {/* Streaming Service Dropdown */}
        <select
          value={newItemService}
          onChange={(e) => setNewItemService(e.target.value)}
          className="selectInput"
          required
        >
          <option value="" disabled>Select a streaming service</option>
          {streamingServices.map((serviceOption) => (
            <option key={serviceOption} value={serviceOption}>
              {serviceOption}
            </option>
          ))}
        </select>
        <button type="submit" className="addButton">
          Add to Group Q
        </button>
      </form>

      {/* Sorting and Filtering Controls */}
      <div className="controlsContainer">
        <div className="control">
          <label htmlFor="sortGroup" className="label">
            Sort By:
          </label>
          <select
            id="sortGroup"
            value={sortOptionGroup}
            onChange={(e) => setSortOptionGroup(e.target.value)}
            className="select"
          >
            <option value="dateDesc">Date Added (Newest)</option>
            <option value="dateAsc">Date Added (Oldest)</option>
            <option value="serviceAsc">Streaming Service (A-Z)</option>
            <option value="serviceDesc">Streaming Service (Z-A)</option>
          </select>
        </div>
        <div className="control">
          <label htmlFor="filterGroup" className="label">
            Filter By Service:
          </label>
          <select
            id="filterGroup"
            value={filterServiceGroup}
            onChange={(e) => setFilterServiceGroup(e.target.value)}
            className="select"
          >
            <option value="all">All Services</option>
            {uniqueServices.map((service, index) => (
              <option key={index} value={service}>
                {service}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Horizontally Scrollable Queue */}
      <div className="queueContainer">
        {displayedQueue.map((item) => (
          <QueueItem key={item.id} item={item} markAsWatched={markAsWatched} />
        ))}
      </div>
    </div>
  );
};

export default GroupQueue;
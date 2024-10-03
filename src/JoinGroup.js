// JoinGroup.js
import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import {
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
} from 'firebase/firestore';
import { Link } from 'react-router-dom';

function JoinGroup() {
  const [groupIdInput, setGroupIdInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastVisible, setLastVisible] = useState(null); // For pagination
  const [hasMore, setHasMore] = useState(true); // To check if more groups are available

  // Fetch available groups from Firestore
  useEffect(() => {
    const fetchInitialGroups = async () => {
      setLoadingGroups(true);
      try {
        const groupsCollection = collection(db, 'groups');
        const q = query(groupsCollection, orderBy('createdAt', 'desc'), limit(20));
        const groupSnapshot = await getDocs(q);
        const groupsList = groupSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setAvailableGroups(groupsList);
        if (groupSnapshot.docs.length > 0) {
          setLastVisible(groupSnapshot.docs[groupSnapshot.docs.length - 1]);
        }
        if (groupSnapshot.docs.length < 20) {
          setHasMore(false);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
        setError('Could not load groups. Please try again later.');
      }
      setLoadingGroups(false);
    };

    fetchInitialGroups();
  }, []);

  // Handle loading more groups (pagination)
  const fetchMoreGroups = async () => {
    if (!hasMore) return;

    setLoadingGroups(true);
    try {
      const groupsCollection = collection(db, 'groups');
      const q = query(
        groupsCollection,
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(20)
      );
      const groupSnapshot = await getDocs(q);
      const groupsList = groupSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setAvailableGroups(prev => [...prev, ...groupsList]);
      if (groupSnapshot.docs.length > 0) {
        setLastVisible(groupSnapshot.docs[groupSnapshot.docs.length - 1]);
      }
      if (groupSnapshot.docs.length < 20) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching more groups:', error);
      setError('Could not load more groups. Please try again later.');
    }
    setLoadingGroups(false);
  };

  // Handle joining a group by ID
  const handleJoinGroupById = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!groupIdInput.trim()) {
      setError('Please enter a valid Group ID.');
      return;
    }

    setLoadingJoin(true);
    console.log(`Attempting to join group with ID: ${groupIdInput}`); // Debug log

    try {
      const groupDocRef = doc(db, 'groups', groupIdInput);
      const groupDocSnap = await getDoc(groupDocRef);

      if (!groupDocSnap.exists()) {
        setError('Group does not exist. Please check the Group ID.');
        setLoadingJoin(false);
        return;
      }

      const groupData = groupDocSnap.data();
      const isAlreadyMember = groupData.members.includes(auth.currentUser.uid);
      console.log(`Is already a member: ${isAlreadyMember}`); // Debug log

      if (isAlreadyMember) {
        setError('You are already a member of this group.');
        setLoadingJoin(false);
        return;
      }

      // Add the user to the group's members array
      await updateDoc(groupDocRef, {
        members: arrayUnion(auth.currentUser.uid),
      });
      console.log('Added user to group members array.'); // Debug log

      // Add the groupId to the user's groups array
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      console.log(`Updating user document with group ID: ${groupIdInput}`); // Debug log
      await updateDoc(userDocRef, {
        groups: arrayUnion(groupIdInput),
      });
      console.log('Added group ID to user document.'); // Debug log

      setGroupIdInput('');
      setSuccess('Successfully joined the group!');
    } catch (error) {
      console.error('Error joining group:', error);
      setError('Could not join the group. Please try again.');
    }
    setLoadingJoin(false);
  };

  // Handle joining a group from the list
  const handleJoinGroupFromList = async (selectedGroupId) => {
    setError('');
    setSuccess('');
    setLoadingJoin(true);
    console.log(`Attempting to join group from list with ID: ${selectedGroupId}`); // Debug log

    try {
      const groupDocRef = doc(db, 'groups', selectedGroupId);
      const groupDocSnap = await getDoc(groupDocRef);

      if (!groupDocSnap.exists()) {
        setError('Group does not exist. Please try again.');
        setLoadingJoin(false);
        return;
      }

      const groupData = groupDocSnap.data();
      const isAlreadyMember = groupData.members.includes(auth.currentUser.uid);
      console.log(`Is already a member: ${isAlreadyMember}`); // Debug log

      if (isAlreadyMember) {
        setError('You are already a member of this group.');
        setLoadingJoin(false);
        return;
      }

      // Add the user to the group's members array
      await updateDoc(groupDocRef, {
        members: arrayUnion(auth.currentUser.uid),
      });
      console.log('Added user to group members array.'); // Debug log

      // Add the groupId to the user's groups array
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      console.log(`Updating user document with group ID: ${selectedGroupId}`); // Debug log
      await updateDoc(userDocRef, {
        groups: arrayUnion(selectedGroupId),
      });
      console.log('Added group ID to user document.'); // Debug log

      setSuccess('Successfully joined the group!');
    } catch (error) {
      console.error('Error joining group:', error);
      setError('Could not join the group. Please try again.');
    }
    setLoadingJoin(false);
  };

  // Handle searching groups by name
  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!searchTerm.trim()) {
      // If search term is empty, reload the initial group list
      setLoadingGroups(true);
      try {
        const groupsCollection = collection(db, 'groups');
        const q = query(groupsCollection, orderBy('createdAt', 'desc'), limit(20));
        const groupSnapshot = await getDocs(q);
        const groupsList = groupSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setAvailableGroups(groupsList);
        setLastVisible(groupSnapshot.docs[groupSnapshot.docs.length - 1]);
        setHasMore(groupSnapshot.docs.length === 20);
      } catch (error) {
        console.error('Error fetching groups:', error);
        setError('Could not load groups. Please try again later.');
      }
      setLoadingGroups(false);
      return;
    }

    // Search for groups where name contains the search term (case-insensitive)
    setLoadingGroups(true);
    try {
      const groupsCollection = collection(db, 'groups');
      // Firestore doesn't support "contains" queries directly.
      // Implementing client-side filtering by fetching a reasonable number of groups.
      const q = query(groupsCollection, orderBy('name'), limit(100)); // Adjust the limit as needed
      const groupSnapshot = await getDocs(q);
      const allGroups = groupSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      }));

      const filteredGroups = allGroups.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setAvailableGroups(filteredGroups);
      setHasMore(false); // Assuming search results are limited
    } catch (error) {
      console.error('Error searching groups:', error);
      setError('Could not search groups. Please try again later.');
    }
    setLoadingGroups(false);
  };

  return (
    <div style={styles.container}>
      <h2>Join a Group</h2>
      {error && <p style={styles.error}>{error}</p>}
      {success && <p style={styles.success}>{success}</p>}

      {/* Join by Group ID */}
      <div style={styles.section}>
        <h3>Join by Group ID</h3>
        <form onSubmit={handleJoinGroupById} style={styles.form}>
          <input
            type="text"
            placeholder="Enter Group ID"
            value={groupIdInput}
            onChange={(e) => setGroupIdInput(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.button} disabled={loadingJoin}>
            {loadingJoin ? 'Joining...' : 'Join Group'}
          </button>
        </form>
      </div>

      <hr style={styles.hr} />

      {/* Join from Available Groups */}
      <div style={styles.section}>
        <h3>Join from Available Groups</h3>
        {/* Search Form */}
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            type="text"
            placeholder="Search Groups by Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.button} disabled={loadingGroups}>
            {loadingGroups ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Groups List */}
        {loadingGroups ? (
          <p>Loading groups...</p>
        ) : availableGroups.length > 0 ? (
          <>
            <ul style={styles.ul}>
              {availableGroups.map((group) => (
                <li key={group.id} style={styles.li}>
                  <div>
                    <strong>{group.name}</strong>
                    <p style={styles.groupId}>ID: {group.id}</p>
                  </div>
                  <button
                    onClick={() => handleJoinGroupFromList(group.id)}
                    style={styles.joinButton}
                    disabled={loadingJoin}
                  >
                    {loadingJoin ? 'Joining...' : 'Join'}
                  </button>
                </li>
              ))}
            </ul>
            {/* Load More Button for Pagination */}
            {hasMore && (
              <button onClick={fetchMoreGroups} style={styles.loadMoreButton} disabled={loadingGroups}>
                {loadingGroups ? 'Loading...' : 'Load More'}
              </button>
            )}
          </>
        ) : (
          <p>No groups found.</p>
        )}
      </div>

      {/* Link to Create Group if needed */}
      <div style={styles.createLink}>
        <p>
          Can't find the group you're looking for? <Link to="/create-group">Create a new group</Link>.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '700px',
    margin: '30px auto',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', // Subtle shadow for better UI
  },
  section: {
    marginBottom: '30px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '10px',
  },
  searchForm: {
    display: 'flex',
    marginBottom: '15px',
  },
  input: {
    flex: 1,
    padding: '10px',
    marginRight: '10px',
    borderRadius: '3px',
    border: '1px solid #ccc',
    fontSize: '16px',
    outline: 'none',
    transition: 'border 0.3s',
  },
  button: {
    padding: '10px 15px',
    borderRadius: '3px',
    border: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    minWidth: '100px',
  },
  joinButton: {
    padding: '8px 12px',
    borderRadius: '3px',
    border: 'none',
    backgroundColor: '#28a745',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s',
  },
  loadMoreButton: {
    padding: '10px 15px',
    borderRadius: '3px',
    border: 'none',
    backgroundColor: '#6c757d',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    marginTop: '15px',
  },
  hr: {
    margin: '20px 0',
    border: 'none',
    borderTop: '1px solid #ccc',
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
  groupId: {
    fontSize: '12px',
    color: '#555',
  },
  error: {
    color: 'red',
    marginBottom: '15px',
  },
  success: {
    color: 'green',
    marginBottom: '15px',
  },
  createLink: {
    textAlign: 'center',
    marginTop: '20px',
  },
};

export default JoinGroup;
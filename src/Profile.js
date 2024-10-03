// Profile.js
import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import {
  doc,
  updateDoc,
  arrayUnion,
  collection,
  query,
  where,
  getDocs,
  onSnapshot, // Import onSnapshot
} from 'firebase/firestore';
import { Link } from 'react-router-dom';

function Profile() {
  const [userData, setUserData] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(false); // Initialize as false
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Function to add an item to the user's personal queue
  const addItemToQueue = async (item) => {
    try {
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDoc, {
        queue: arrayUnion(item),
      });
      setSuccess(`"${item.name}" has been added to your queue.`);
      setTimeout(() => setSuccess(null), 3000); // Clear success message after 3 seconds
    } catch (error) {
      console.error('Error adding item to queue:', error);
      setError('Failed to add item to your queue. Please try again.');
      setTimeout(() => setError(null), 3000); // Clear error message after 3 seconds
    }
  };

  useEffect(() => {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    
    const unsubscribeUser = onSnapshot(userDocRef, async (userDocSnap) => {
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setUserData(data);
        setError(null);

        // Fetch user's groups if they exist
        const groupIds = data.groups || [];
        if (groupIds.length > 0) {
          setLoadingGroups(true); // Start loading groups
          try {
            // Firestore 'in' queries can handle up to 10 items
            const batches = [];
            const batchSize = 10;
            for (let i = 0; i < groupIds.length; i += batchSize) {
              const batch = groupIds.slice(i, i + batchSize);
              batches.push(batch);
            }

            const groupPromises = batches.map(async (batch) => {
              const q = query(collection(db, 'groups'), where('__name__', 'in', batch));
              const groupSnap = await getDocs(q);
              return groupSnap.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name,
              }));
            });

            const groupsData = await Promise.all(groupPromises);
            // Flatten the array of arrays
            const flattenedGroups = groupsData.flat();
            setUserGroups(flattenedGroups);
          } catch (err) {
            console.error('Error fetching user groups:', err);
            setError('Failed to load your groups.');
            setUserGroups([]);
          } finally {
            setLoadingGroups(false); // Stop loading groups
          }
        } else {
          setUserGroups([]);
        }
      } else {
        setError('No profile data found.');
        setUserData(null);
      }
      setLoadingUser(false);
    }, (err) => {
      console.error('Error listening to user document:', err);
      setError('Failed to load profile data.');
      setLoadingUser(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribeUser();
  }, []);

  if (loadingUser) {
    return (
      <div style={styles.loadingContainer}>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {success && <p style={styles.success}>{success}</p>}
      {error && <p style={styles.error}>{error}</p>}

      {/* User Profile Information */}
      <div style={styles.section}>
        <h1>{userData.displayName}'s Profile</h1>
        <p>
          <strong>Email:</strong> {userData.email}
        </p>
      </div>

      {/* Recommendations Section */}
      {userData.recommendations && userData.recommendations.length > 0 && (
        <div style={styles.section}>
          <h2>Recommendations</h2>
          <ul style={styles.ul}>
            {userData.recommendations.map((item) => (
              <li key={item.id} style={styles.li}>
                <div>
                  <strong>{item.name}</strong> on <em>{item.service}</em>
                </div>
                <button
                  onClick={() => addItemToQueue(item)}
                  style={styles.addButton}
                >
                  Add to My Queue
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* User's Groups Section */}
      <div style={styles.section}>
        <h2>My Groups</h2>
        {loadingGroups ? (
          <p>Loading groups...</p>
        ) : userGroups.length > 0 ? (
          <ul style={styles.groupList}>
            {userGroups.map((group) => (
              <li key={group.id} style={styles.groupItem}>
                <Link to={`/groups/${group.id}`} style={styles.groupLink}>
                  {group.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>You are not part of any groups yet.</p>
        )}
        <div style={styles.createLink}>
          <p>
            Want to join a group? <Link to="/join-group">Join a group</Link> or{' '}
            <Link to="/create-group">create a new group</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '30px auto',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  section: {
    marginBottom: '40px',
  },
  ul: {
    listStyle: 'none',
    padding: 0,
  },
  li: {
    padding: '12px 0',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#28a745',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s',
  },
  groupList: {
    listStyle: 'none',
    padding: 0,
  },
  groupItem: {
    padding: '8px 0',
    borderBottom: '1px solid #eee',
  },
  groupLink: {
    textDecoration: 'none',
    color: '#007bff',
    fontSize: '16px',
  },
  createLink: {
    marginTop: '20px',
    textAlign: 'center',
  },
  error: {
    color: 'red',
    marginBottom: '15px',
    textAlign: 'center',
  },
  success: {
    color: 'green',
    marginBottom: '15px',
    textAlign: 'center',
  },
  loadingContainer: {
    maxWidth: '800px',
    margin: '50px auto',
    padding: '20px',
    textAlign: 'center',
  },
  errorContainer: {
    maxWidth: '800px',
    margin: '50px auto',
    padding: '20px',
    textAlign: 'center',
  },
};

export default Profile;
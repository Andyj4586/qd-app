// CreateGroup.js
import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import {
  doc,
  updateDoc,
  arrayUnion,
  collection,
  addDoc, // Imported addDoc
} from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';

function CreateGroup() {
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!isAuthenticated) {
      setError('You must be logged in to create a group.');
      return;
    }

    if (!groupName.trim()) {
      setError('Group name cannot be empty.');
      return;
    }

    setLoading(true);
    console.log('Creating group with name:', groupName);
    console.log('User UID:', auth.currentUser.uid);

    try {
      // Reference to the 'groups' collection
      const groupsCollectionRef = collection(db, 'groups');
      console.log('Groups Collection Reference:', groupsCollectionRef);

      // Add a new document with an auto-generated ID and set its data
      const newGroupRef = await addDoc(groupsCollectionRef, {
        name: groupName,
        members: [auth.currentUser.uid],
        createdAt: new Date(),
      });
      console.log('Group document created with ID:', newGroupRef.id);

      // Update the user document to include this group
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      console.log('User Document Reference:', userDocRef);

      await updateDoc(userDocRef, {
        groups: arrayUnion(newGroupRef.id),
      });
      console.log('Updated user document with group ID:', newGroupRef.id);

      setSuccess('Group created successfully!');
      setGroupName('');
      navigate(`/groups/${newGroupRef.id}`); // Redirect to the new group's page
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Failed to create group. Please try again.');
    }

    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div style={styles.container}>
        <h2>Create a New Group</h2>
        <p>You must be logged in to create a group.</p>
        <Link to="/login">Go to Login</Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>Create a New Group</h2>
      {error && <p style={styles.error}>{error}</p>}
      {success && <p style={styles.success}>{success}</p>}
      <form onSubmit={handleCreateGroup} style={styles.form}>
        <input
          type="text"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Creating...' : 'Create Group'}
        </button>
      </form>
      <p>
        Already have a group? <Link to="/join-group">Join a group</Link>.
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '500px',
    margin: '50px auto',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '15px',
  },
  input: {
    padding: '10px',
    marginBottom: '15px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '16px',
    outline: 'none',
    transition: 'border 0.3s',
  },
  button: {
    padding: '10px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    minWidth: '100px',
    disabled: {
      backgroundColor: '#777',
      cursor: 'not-allowed',
    },
  },
  error: {
    color: 'red',
    marginBottom: '15px',
  },
  success: {
    color: 'green',
    marginBottom: '15px',
  },
};

export default CreateGroup;
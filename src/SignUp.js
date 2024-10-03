// SignUp.js
import React, { useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(''); // New field for display name
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // New state for loading indicator

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); // Start loading

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update Firebase Auth profile with display name (optional but recommended)
      await updateProfile(user, {
        displayName: displayName,
      });

      // Save additional data (display name and initialize other fields) to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        displayName: displayName,
        email: user.email,
        groups: [], // Initialize with an empty groups array
        queue: [], // Initialize with an empty personal queue
        watchedQueueItems: [], // Initialize with an empty watched items array
        createdAt: new Date(), // Optional: Track when the user was created
      });

      setLoading(false); // Stop loading
      navigate('/home'); // Redirect to home after successful sign-up
    } catch (error) {
      console.error('Error signing up:', error);
      // Provide more user-friendly error messages based on error codes
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('This email is already in use. Please try logging in or use a different email.');
          break;
        case 'auth/invalid-email':
          setError('The email address is invalid. Please enter a valid email.');
          break;
        case 'auth/weak-password':
          setError('The password is too weak. Please enter a stronger password (6+ characters).');
          break;
        default:
          setError('An unexpected error occurred. Please try again.');
      }
      setLoading(false); // Stop loading
    }
  };

  return (
    <div style={styles.container}>
      <h1>Sign Up</h1>
      {error && <p style={styles.error}>{error}</p>}
      <form onSubmit={handleSignUp} style={styles.form}>
        <input
          type="text"
          placeholder="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password (6+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    textAlign: 'center',
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', // Added subtle shadow for better UI
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '15px',
  },
  input: {
    padding: '10px',
    marginBottom: '15px',
    borderRadius: '3px',
    border: '1px solid #ccc',
    fontSize: '16px',
    outline: 'none',
    transition: 'border 0.3s',
  },
  button: {
    padding: '10px',
    borderRadius: '3px',
    border: 'none',
    backgroundColor: '#333',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    disabled: {
      backgroundColor: '#777',
      cursor: 'not-allowed',
    },
  },
  error: {
    color: 'red',
    marginBottom: '15px',
  },
};

export default SignUp;
// src/NavBar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from './firebase';

function NavBar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        console.log('User signed out successfully.');
        navigate('/login'); // Redirect to Login page after logout
      })
      .catch((error) => {
        console.error('Error signing out:', error);
        // Optionally, display an error message to the user
      });
  };

  return (
    <nav style={styles.nav}>
      <ul style={styles.ul}>
        <li style={styles.appName}>
          {auth.currentUser ? (
            <Link to="/home" style={styles.link}>Q'd</Link>
          ) : (
            <Link to="/login" style={styles.link}>Q'd</Link>
          )}
        </li>
        {auth.currentUser ? (
          <>
            <li style={styles.li}><Link to="/home" style={styles.link}>Home</Link></li>
            <li style={styles.li}><Link to="/profile" style={styles.link}>Profile</Link></li>
            <li style={styles.li}><Link to="/creategroup" style={styles.link}>Create Group</Link></li>
            <li style={styles.li}><Link to="/joingroup" style={styles.link}>Join Group</Link></li>
            <li style={styles.li}>
              <button onClick={handleLogout} style={styles.button}>Log Out</button>
            </li>
          </>
        ) : (
          <>
            <li style={styles.li}><Link to="/login" style={styles.link}>Login</Link></li>
            <li style={styles.li}><Link to="/signup" style={styles.link}>Sign Up</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
}

const styles = {
    nav: {
      padding: '10px',
      backgroundColor: '#333',
      display: 'flex',
      justifyContent: 'space-between', // Distribute space between App name and navigation links
      alignItems: 'center',
    },
    ul: {
      listStyle: 'none',
      display: 'flex',
      margin: 0,
      padding: 0,
    },
    appName: {
      marginRight: 'auto', // Push navigation links to the right
      fontSize: '24px',
      fontWeight: 'bold',
    },
    li: {
      marginLeft: '20px',
    },
    link: {
      color: '#fff',
      textDecoration: 'none',
      fontSize: '16px',
    },
    button: {
      backgroundColor: '#555',
      color: '#fff',
      border: 'none',
      padding: '8px 16px',
      cursor: 'pointer',
      fontSize: '16px',
      borderRadius: '4px',
    },
  };

export default NavBar;
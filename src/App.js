// src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import SignUp from './SignUp';
import Login from './Login';
import Home from './Home';
import NavBar from './NavBar';
import Profile from './Profile';
import CreateGroup from './CreateGroup';
import JoinGroup from './JoinGroup';
import GroupQueue from './GroupQueue';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });
    return unsubscribe;
  }, []);

  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={
          isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
        <Route
          path="/home"
          element={
            isAuthenticated ? <Home /> : <Navigate to="/login" />
          }
        />
        <Route path="/creategroup" element={<CreateGroup />} />
        <Route path="/joingroup" element={<JoinGroup />} />
        <Route path="/groups/:groupId" element={<GroupQueue />} />
      </Routes>
    </Router>
  );
}

export default App;
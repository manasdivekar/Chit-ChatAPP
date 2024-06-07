
import './App.css';
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ChatPage from './pages/ChatPage';

function App() {
  return (
    <div className="App">
      <Route path='/' component ={Home} exact />
      <Route path='/chats' component = {ChatPage} />
    </div>
  );
}

export default App;

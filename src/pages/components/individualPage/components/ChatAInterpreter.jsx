import React, { useState } from 'react';
import axios from 'axios';

export default function AIChat({ testResults }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const sendMessage = async () => {
        const ticker = document.getElementById('ticker').innerText;
        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;
    
    // Send to AI backend
    const response = await axios.post(`http://localhost:5000/ai-interpret/`, {
     
      testResults
    });
    setMessages([...messages, { sender: 'user', text: input }, { sender: 'ai', text: response.data.reply }]);
    setInput('');
  };

  return (
    <div style={{border: '1px solid #ccc', padding: 10, maxWidth: 300}}>
      <div style={{overflowY: 'auto'}}>
        {messages.map((msg, i) => (
          <div key={i} style={{textAlign: msg.sender === 'user' ? 'right' : 'left'}}>
            <b>{msg.sender === 'user' ? 'You' : 'AI'}:</b> {msg.text}
          </div>
        ))}
      </div>
      <button onClick={sendMessage}>Send Info</button>
    </div>
  );
}
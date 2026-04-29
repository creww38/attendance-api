// test.js - Simple test to check if Node.js works
console.log('Hello from Node.js!');
console.log('Current directory:', __dirname);
console.log('Node version:', process.version);

try {
    require('dotenv').config();
    console.log('✅ dotenv loaded');
    
    const express = require('express');
    console.log('✅ express loaded');
    
    console.log('All dependencies loaded successfully!');
} catch (error) {
    console.error('❌ Error loading dependencies:', error.message);
}
if (typeof firebase === 'undefined') throw new Error('hosting/init-error: Firebase SDK not detected. You must include it before /__/firebase/init.js');
firebase.initializeApp({
  "apiKey": "AIzaSyB_S4PLOVGJXPYsgRwKiII93LpRhWFMmok",
  "authDomain": "ihs-artists-console.firebaseapp.com",
  "databaseURL": "https://ihs-artists-console.firebaseio.com",
  "messagingSenderId": "643854287145",
  "projectId": "ihs-artists-console",
  "storageBucket": "ihs-artists-console.appspot.com"
});
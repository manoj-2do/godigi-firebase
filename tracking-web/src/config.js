export const firebaseConfig = {
    apiKey:            "AIzaSyDwOorr7BAOHrlnr5IF7S2gVM2BLpcjYcI",
    authDomain:        "godigi-8af79.firebaseapp.com",
    projectId:         "godigi-8af79",
    storageBucket:     "godigi-8af79.firebasestorage.app",
    messagingSenderId: "1096637238495",
    appId:             "1:1096637238495:web:cf32ee534692f83898ed6a",
    measurementId:     "G-9LQP7K9NYD",
  };
  
  export const isDev = import.meta.env.DEV;
  export const log    = (...a) => { if (isDev) console.log(...a); };
  export const logErr = (...a) => { if (isDev) console.error(...a); };
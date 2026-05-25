// /**
//  * NON-PROD
// export const firebaseConfig = {
//       apiKey:            "AIzaSyDwOorr7BAOHrlnr5IF7S2gVM2BLpcjYcI",
//       authDomain:        "godigi-8af79.firebaseapp.com",
//       projectId:         "godigi-8af79",
//       storageBucket:     "godigi-8af79.firebasestorage.app",
//       messagingSenderId: "1096637238495",
//       appId:             "1:1096637238495:web:cf32ee534692f83898ed6a",
//       measurementId:     "G-9LQP7K9NYD",
//     };
// */

/** PROD */
export const firebaseConfig = {
  apiKey: "AIzaSyBRW5jKR5SbQ0zJqdhd2rLIyUJ-sBbQckI",
  authDomain: "ontrip-godigi-driver.firebaseapp.com",
  projectId: "ontrip-godigi-driver",
  storageBucket: "ontrip-godigi-driver.firebasestorage.app",
  messagingSenderId: "911842961209",
  appId: "1:911842961209:web:2b41fdccd7930534816ae8",
  measurementId: "G-E569NQ1M0R"
};

  // export const isDev = import.meta.env.DEV;
  export const isDev = false;
  export const log    = (...a) => { if (isDev) console.log(...a); };
  export const logErr = (...a) => { if (isDev) console.error(...a); };
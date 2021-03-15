import * as admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://hyggecoin-default-rtdb.europe-west1.firebasedatabase.app/'
});

export default admin.database();
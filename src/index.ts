import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin'
admin.initializeApp();
const db = admin.firestore();
const fcm = admin.messaging();

export const rideRequestNotification = functions.firestore.document('requests/{requestId}').onCreate(
    async snapshot => {
        const rideRequet = snapshot.data();

        let tokens: string[] = []

        const drivers = await db.collection('drivers').get()   

        drivers.forEach(document => {
            
        console.log(`DATA: ${document.data().token}`);

            tokens.push(document.data().token)
        })


        
        const payload: admin.messaging.MessagingPayload = {
            notification: {
                title: "Ride request",
                body: `${rideRequet.username} is looking for a ride to ${rideRequet.destination}`,
                clickAction: 'FLUTTER_NOTIFICATION_CLICK'
            }
        }

        console.log(`NUMBER OF TOKENS IS: ${tokens.length}`);

       return fcm.sendToDevice(tokens, payload);
    }
)



// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

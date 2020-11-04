import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin'
admin.initializeApp();
const db = admin.firestore();
const fcm = admin.messaging();

export const locationReachedNotification = functions.https.onRequest(async (request, response) => {
    const userId = request.query.uid?.toString();
    const driverId = request.query.did?.toString();
    const requestId = request.query.rid?.toString();

    if(userId === null){
        console.log("USER NAME IS EMPTY")
        console.log("USER NAME IS EMPTY")

    }else{
        console.log(`the user is ${userId}`)
        console.log(`the user is ${userId}`)

    }

    const user = await db.collection('users').doc((userId?.toString() || '')).get()
    const token = user.data()?.token

    try {
        const payload: admin.messaging.MessagingPayload = {
            notification: {
                title: "Your ride is here",
                body: `Hey there, your ride is at the pickup location`,
                clickAction: 'FLUTTER_NOTIFICATION_CLICK'
            },
            data: {
                userId: userId ?? '',
                id: requestId ?? '',
                driverId: driverId ?? '',
                type: 'DRIVER_AT_LOCATION'
            }
        }

        console.log("Token is" + token)
        fcm.sendToDevice([token], payload).catch(
            error => {
                response.status(500).send(error)
            }
        );
        response.send("notification sent")
    } catch (error) {
        console.log('ERROR:: ' + error)
        response.send("Notification not sent").status(500)
        
    }

    
})

export const rideAcceptedNotification = functions.firestore.document('requests/{requestId}').onUpdate(async snapshot => {
    const rideRequet = snapshot.after.data();

    if(rideRequet.status === "accepted"){
        const tokens: string[] = []

        const users = await db.collection('users').get()  
    
        users.forEach(document => {
            const userData = document.data()
            console.log(`user id: ${userData.id}`);
            console.log(`another user id: ${rideRequet.userId}`);
    
            if (userData.id === rideRequet.userId){
                tokens.push(userData.token);
            }
        })
    
        const payload: admin.messaging.MessagingPayload = {
            notification: {
                title: "Ride request accepted",
                body: `Hey there, your ride is on the way`,
                clickAction: 'FLUTTER_NOTIFICATION_CLICK'
            },
            data: {
                destination: rideRequet.destination.address,
                distance_text: rideRequet.distance.text,
                distance_value: rideRequet.distance.value.toString(),
                destination_latitude: rideRequet.destination.latitude.toString(),
                destination_longitude: rideRequet.destination.longitude.toString(),
                id: rideRequet.id,
                driverId: rideRequet.driverId,
                type: 'REQUEST_ACCEPTED'

            }
        }
    
        console.log(`NUMBER OF TOKENS IS: ${tokens.length}`);
    
        return fcm.sendToDevice(tokens, payload);
    }else{
        console.log("RIDE STATUS IS: " + rideRequet.status)
        return;
    }



});

export const rideRequestNotification = functions.firestore.document('requests/{requestId}').onCreate(
    async snapshot => {
        const rideRequet = snapshot.data();

        const tokens: string[] = []

        const drivers = await db.collection('drivers').get()   

        drivers.forEach(document => {
            
        console.log(`DATA: ${document.data().token}`);

            tokens.push(document.data().token)
        })


        
        const payload: admin.messaging.MessagingPayload = {
            notification: {
                title: "Ride request",
                body: `${rideRequet.username} is looking for a ride to ${rideRequet.destination.address}`,
                clickAction: 'FLUTTER_NOTIFICATION_CLICK'
            },
            data: {
                username: rideRequet.username,
                destination: rideRequet.destination.address,
                distance_text: rideRequet.distance.text,
                distance_value: rideRequet.distance.value.toString(),
                destination_latitude: rideRequet.destination.latitude.toString(),
                destination_longitude: rideRequet.destination.longitude.toString(),
                user_latitude: rideRequet.position.latitude.toString(),
                user_longitude: rideRequet.position.longitude.toString(),
                id: rideRequet.id,
                userId: rideRequet.userId,
                type: 'RIDE_REQUEST'

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

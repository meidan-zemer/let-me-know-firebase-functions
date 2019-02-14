import * as functions from 'firebase-functions';
import * as firebase from 'firebase-admin';
import {
    contactPointsCollectionName,
    discussionsSubCollectionName,
    messagesSubCollectionName,
    discussionType} from 'let-me-know-common';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
//

//const app = firebase.initializeApp();
//const firestore = app.firestore();


export const updateNumberOfMessages = functions.firestore
    .document(`${contactPointsCollectionName}/{cpId}/${discussionsSubCollectionName}/{connectorId}/${messagesSubCollectionName}/{messageId}`)
    .onCreate((snapshot, context) : any => {
        const discussionRef = snapshot.ref.parent && snapshot.ref.parent.parent;
        if(discussionRef !== null){
            return  discussionRef.get()
                .then(( discussionSnapshot ) :any=> {
                    const documentData = discussionSnapshot.data();
                    if(documentData){
                        const oldDiscussion =  documentData as discussionType;
                        const numberOfMessages = oldDiscussion.numberOfMessages ? oldDiscussion.numberOfMessages+1 : 1;
                        const newDiscussion = {
                            ...discussionSnapshot.data(),
                            modifiedDate:firebase.firestore.FieldValue.serverTimestamp(),
                            numberOfMessages
                        };
                        return discussionRef.update(newDiscussion);
                    };
                    return ;
                });
        }
        return ;
    });
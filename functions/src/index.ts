import * as functions from 'firebase-functions';
import * as firebase from 'firebase-admin';
import {
    contactPointsCollectionName,
    discussionsSubCollectionName,
    messagesSubCollectionName,
    usersCollectionName,
    discussionType, contactPointType, userDiscussionsCollectionName
} from 'let-me-know-common';

import {DocumentSnapshot} from "firebase-functions/lib/providers/firestore";

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
//

firebase.initializeApp();
export const userCreation = functions.auth.user().onCreate((user, context)=>{
    return addUser(user.uid);
});
export const updateNumberOfMessages = functions.firestore
    .document(`${contactPointsCollectionName}/{cpId}/${discussionsSubCollectionName}/{connectorId}/${messagesSubCollectionName}/{messageId}`)
    .onCreate((snapshot, context) : any => {
        return updateMessageCount(snapshot)
            .then(()=>updateUsersNewMessage(context));
    });


function updateUsersNewMessage(context:functions.EventContext):Promise<any>{
    const cpId:string = context.params[`cpId`];
    const connectorId:string= context.params[`connectorId`];
    const uid = context && context.auth && context.auth.uid;
    const cpRef = firebase.firestore().doc(`${contactPointsCollectionName}/${cpId}`);
    return cpRef.get()
       .then((cpSnapshot)=> {
           const cp:contactPointType = cpSnapshot.data() as contactPointType;
           const updatedUid = uid === cp.userId ? connectorId : cp.userId;
           return updateUserNewMessage(updatedUid,cp.cpId,connectorId);
       });
}
function updateUserNewMessage(uid:string,cpId:string, connectorId:string):Promise<any>{
    const ref = firebase.firestore().doc(`${usersCollectionName}/${uid}/${userDiscussionsCollectionName}/${cpId}`);
    return ref.get()
        .then((snapshot)=>{
            if(snapshot.exists){
                let obj:any  = snapshot.data();
                let num=obj[connectorId];
                return ref.update({
                    [connectorId]:num+1
                });
            } else{
                return ref.set({[connectorId]:1});
            }
        });
}

function addUser(uid:string) : Promise<any>{
    const userDoc:any = {
        id:uid
    };
    const userRef = firebase.firestore().doc(`${usersCollectionName}/{${uid}`);
    return userRef.set(userDoc)
}
function updateMessageCount(snapshot:DocumentSnapshot):Promise<any>{
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
                }
                return Promise.resolve();
            });
    }
    return Promise.resolve();

}
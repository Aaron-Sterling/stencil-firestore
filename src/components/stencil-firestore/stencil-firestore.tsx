import { Component, Method } from '@stencil/core';
//
import { firebase } from '@firebase/app';
import { FirebaseOptions, FirebaseApp } from '@firebase/app-types';
//
import { registerFirestore } from '@firebase/firestore';
import { FirestoreError, WhereFilterOp } from '@firebase/firestore-types';
//
import { Observable } from 'rxjs/Observable';
//
import { collectionObservableFromOnSnapshot, collectionRefFromPath, docRefFromDocPath, 
         documentObservableFromOnSnapshot, querySnapshotToArray, collectionObservableFromQuery } from './helper-functions';




@Component({
  tag: 'stencil-firestore',
  styleUrl: 'stencil-firestore.css'
})
export class StencilFirestore {

  private _mainFirebaseApp: FirebaseApp;

  // initialize

  @Method()
  initializeFirestore(options: FirebaseOptions) {
    this._mainFirebaseApp = firebase.initializeApp(options);
    registerFirestore(this._mainFirebaseApp);
  }

  @Method()
  getMainFirebaseApp(): FirebaseApp {
    return this._mainFirebaseApp;
  }

  // delete

  deleteDocument(path: string): Promise<void> {
    const docRef = docRefFromDocPath(this._mainFirebaseApp, path);
    return docRef.delete();
  }

  // existence check

  documentExists(path: string): Promise<boolean> {
    const docRef = docRefFromDocPath(this._mainFirebaseApp, path);
    return docRef.get().then(snapshot => snapshot.exists);
  }

  // write

  // this method makes no changes if the document already exists
  createNewDocument<T>(path: string, docToCreate: T): Promise<void> {
    const docRef = docRefFromDocPath(this._mainFirebaseApp, path);
    return docRef.set(docToCreate);
  }

  // this methd makes no changes if the document does not exist
  updateExistingDocument<T>(path: string, docToUpdate: T): Promise<void> {
    const docRef = docRefFromDocPath(this._mainFirebaseApp, path);
    return docRef.update(docToUpdate);
  }

  // this method creates or updates, depending on whether the document already exists
  upsertDocument<T>(path: string, doc: T): Promise<void> {
    return this.documentExists(path)
               .then(exists => {
                                if (exists) { return this.updateExistingDocument<T>(path, doc) }
                                else { return this.createNewDocument<T>(path, doc) }
                               });
  }

  // read and listen

  // read document once
  @Method()
  readDocumentOnce<T>(docPath: string): Promise<T> {
    let docRef = docRefFromDocPath(this._mainFirebaseApp, docPath);
    return docRef.get().then(doc => {
                                     if (doc.exists) { return (doc.data() as T) }
                                     else {return null}
                                    }
                            ).catch((err: FirestoreError) => { this.readError(err); return null; });
  }

  // listen to stream of changes to a document
  @Method()
  listenToDocument<T>(docPath: string): Observable<T> {
    let docRef = docRefFromDocPath(this._mainFirebaseApp, docPath);
    return documentObservableFromOnSnapshot<T>(docRef);
  }

  // read collection once
  @Method()
  readCollectionOnce<T>(path: string): Promise<Array<T>> {
    let collectionRef = collectionRefFromPath(this._mainFirebaseApp, path);
    return collectionRef.get().then(snapshot => querySnapshotToArray<T>(snapshot));
  }

  // query collection once ("identical" to the previous method, but with a querty input)
  @Method()
  queryCollectionOnce<T>(path: string, filter: string, operation: WhereFilterOp, value: string): Promise<Array<T>> {
    let collectionRef = collectionRefFromPath(this._mainFirebaseApp, path);
    return collectionRef.where(filter, operation, value).get()
                        .then(snapshot => querySnapshotToArray<T>(snapshot));
  }

  // stream that emits changes to the referenced collection
  @Method()
  listenToCollection<T>(path: string): Observable<Array<T>> {
    let collectionRef = collectionRefFromPath(this._mainFirebaseApp, path);
    return collectionObservableFromOnSnapshot<T>(collectionRef);
  }

  // listen to collection query
  @Method()
  listenToCollectionQuery<T>(path: string, filter: string, operation: WhereFilterOp, value: string): Observable<Array<T>> {
    let query = collectionRefFromPath(this._mainFirebaseApp, path).where(filter, operation, value);
    return collectionObservableFromQuery<T>(query);
  }

  
  //TODO: error trapping
  readError(err: FirestoreError) {
    console.error('read error: ',err.code);
  }

  render() {
    return (
      <slot />
    );
  }
}

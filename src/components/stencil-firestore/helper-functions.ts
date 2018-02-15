// helper methods

import { FirebaseApp } from '@firebase/app-types';
import { DocumentReference, CollectionReference, QuerySnapshot, Query } from '@firebase/firestore-types';
//
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';


export function docRefFromDocPath(app: FirebaseApp, docPath: string): DocumentReference {
    return app.firestore().doc(docPath);
}

export function collectionRefFromPath(app: FirebaseApp, path: string): CollectionReference {
    return app.firestore().collection(path);
}

export function documentObservableFromOnSnapshot<T>(docRef: DocumentReference): Observable<T> {
    return Observable.create((observer: Observer<T>) => 
                                docRef.onSnapshot(snapshot => observer.next(snapshot.data() as T)));
}

export function collectionObservableFromOnSnapshot<T>(collectionRef: CollectionReference): Observable<Array<T>> {
    return Observable.create((observer: Observer<Array<T>>) => 
                                collectionRef.onSnapshot(snapshot => observer.next(querySnapshotToArray<T>(snapshot))));
}

export function querySnapshotToArray<T>(snapshot: QuerySnapshot): Array<T> {
    let ret = new Array<T>();
    snapshot.forEach(doc => ret.push(doc.data() as T));
    return ret;
}

export function collectionObservableFromQuery<T>(query: Query): Observable<Array<T>> {
    return Observable.create((observer: Observer<Array<T>>) => 
                                query.onSnapshot(snapshot => observer.next(querySnapshotToArray<T>(snapshot))));
}
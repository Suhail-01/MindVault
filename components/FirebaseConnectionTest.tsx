'use client';

import { useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';

export function FirebaseConnectionTest() {
  useEffect(() => {
    async function testConnection() {
      const path = 'test/connection';
      try {
        // Use a dummy path to test connection
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
          handleFirestoreError(error, OperationType.GET, path);
        }
        // Other errors are expected if the document doesn't exist
      }
    }
    testConnection();
  }, []);

  return null;
}

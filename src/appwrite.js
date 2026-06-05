import { Client, Databases, ID, Query } from 'appwrite'

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1') // Appwrite Endpoint
    .setProject('6a21e1cc003ab0376d13'); // Project ID

const databases = new Databases(client);

export const updateSearchCount = async (searchTerm, movie) => {
  // 1. Use appwrite SDK to check if the search the term exist in the database
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.equal('searchTerm', searchTerm)
    ])

    // 2. If it does, update the count
     if(result.documents.length > 0) {
      const doc = result.documents[0];

        await databases.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
            count: doc.count + 1,
        })
    // 3. if it doesn't, create a new document with the search term and count as 1
  } else {
    await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        searchTerm,
        count: 1,
        movie_id: movie.id,
        poster_url: movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : '/no-movie.png',
      })
     } 
    } catch (error) {
    console.error(error);
    }
}

export const getTrendingMovies = async () => {
    try {
        const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.orderDesc("count"),
            Query.limit(5)
        ])

        return result.documents;
    } catch (error) {
        console.error(error);
        return [];
}
}
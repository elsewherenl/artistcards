// ==============================================
// Elsewhere Collective - Instagram API
// ==============================================

// ------------------------------------------------
// CONFIGURATION
// ------------------------------------------------

const INSTAGRAM_BUSINESS_ID = "17841474859984348";

// Replace this with your long-lived access token.
// NEVER commit this to a public repository.
const ACCESS_TOKEN = "EAAXk5I8jmXABR1nTKki0wLOdI6i2mYe1vWmeXxnZCCSvrqcYwlUbPRRKiT10GrDk3PPnwffZC88jZCBy8Sbtd4D2OOHSAEc64GoEJThPiaMrwt0OPYei5BVeEVeloJMTX5pd5Ae2vP939JzqPmbeGZA7iZCXxQHZBlMY9dCYfKqtuBxepGLZB9K3IWw9GVhwtRH";

const GRAPH_API_VERSION = "v24.0";
const GRAPH_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;


// ------------------------------------------------
// Generic Graph API helper
// ------------------------------------------------

async function graphRequest(endpoint) {
    const response = await fetch(
        `${GRAPH_URL}/${endpoint}&access_token=${ACCESS_TOKEN}`
    );

    if (!response.ok) {
        throw new Error(`Instagram API Error: ${response.status}`);
    }

    return await response.json();
}


// ------------------------------------------------
// Get Instagram profile
// ------------------------------------------------

async function getProfile() {

    return await graphRequest(
        `${INSTAGRAM_BUSINESS_ID}?fields=id,username,followers_count,media_count`
    );

}


// ------------------------------------------------
// Get latest media
// ------------------------------------------------

async function getMedia(limit = 12) {

    return await graphRequest(
        `${INSTAGRAM_BUSINESS_ID}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=${limit}`
    );

}


// ------------------------------------------------
// Get single media insights
// ------------------------------------------------

async function getMediaInsights(mediaId) {

    return await graphRequest(
        `${mediaId}/insights?metric=reach,saved,views`
    );

}


// ------------------------------------------------
// Publish image
// (We'll build this next)
// ------------------------------------------------

async function publishPost(imageUrl, caption) {

    console.log("Publishing coming soon...");

}

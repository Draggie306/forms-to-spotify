const CLIENT_ID = "YOUR_CLIENT_ID";         // Your Spotify App's client ID, go to https://developer.spotify.com/dashboard
const CLIENT_SECRET = "YOUR_CLIENT_SECRET"; // Your Spotify App's client secret, again on the same page
const PLAYLIST_ID = "YOUR_PLAYLIST_ID";     // The target playlist ID to add tracks to
const REFRESH_TOKEN = "YOUR_REFRESH_TOKEN"; // Read the README to learn how to get this

function getSpotifyAccessToken() {
  const tokenEndpoint = "https://accounts.spotify.com/api/token";
  const authHeader = Utilities.base64Encode(CLIENT_ID + ":" + CLIENT_SECRET);
  const options = {
    method: "post",
    headers: {
      "Authorization": "Basic " + authHeader,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    payload: "grant_type=refresh_token&refresh_token=" + REFRESH_TOKEN,
    muteHttpExceptions: true
    
  };
  
  const response = UrlFetchApp.fetch(tokenEndpoint, options);
  const jsonResponse = JSON.parse(response.getContentText());
  return jsonResponse.access_token;
}

function addSongToPlaylist(songName) {
  const accessToken = getSpotifyAccessToken();
  //console.log("Access token: " + accessToken);
  const searchEndpoint = `https://api.spotify.com/v1/search?q=${encodeURIComponent(songName)}&type=track&limit=1`
  const searchOptions = {
    method: "get",
    headers: { "Authorization": "Bearer " + accessToken },
    muteHttpExceptions: true
  };
  
  const searchResponse = UrlFetchApp.fetch(searchEndpoint, searchOptions);
  const searchJson = JSON.parse(searchResponse.getContentText());
  //console.log("Search results for " + songName + ": " + JSON.stringify(searchJson));
  if (searchJson.tracks && searchJson.tracks.items.length > 0) {
    const trackId = searchJson.tracks.items[0].id;
    console.log(`Adding a track: ${trackId}`)
    const addTrackEndpoint = `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?uris=spotify:track:${trackId}`;
    const addTrackOptions = {
      method: "post",
      headers: { "Authorization": "Bearer " + accessToken },
      muteHttpExceptions: true
    };
    
    UrlFetchApp.fetch(addTrackEndpoint, addTrackOptions);
    return searchJson.tracks.items[0]; // A return isn't really needed but it is useful for viewing the output and to display on the sheet
  }
}

function processSongRequests() {
  const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (let sheet of sheets) {
    console.log(sheet.getName());
  }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form responses 1"); // This is the default, asjust if needed
  const range = sheet.getDataRange();
  const values = range.getValues();

  let attempts = 0 // I love stats!
  let skips = 0
  let added = 0
  let fails = 0
  
  for (let i = 1; i < values.length; i++) { // Starting from 1 to skip header row
    attempts += 1
    const row = values[i];
    let songName = row[1]; // Adjust according to the column with the song name
    console.log("Processing sheet song as input: " + songName);
    if (songName && !row[2]) { // Assuming column 3 (index 2) is used to mark processed rows
      let x = addSongToPlaylist(songName);
      if (!x) { // Case if no results are found - you don't want a bad input breaking everything else!
        console.log(`[FAIL] No search results for this search term!`);
        sheet.getRange(i + 1, 3).setValue(`WARN: Couldn"t find anything for this search query`);
      } else {
        //onsole.log(x);
        const spotifyReturnedSongName = x.name;
        const spotifyReturnedSongAuthor = x.artists[0].name;
        console.log(`[SUCCESS] Added "${spotifyReturnedSongName}" to the playlist.`);
        sheet.getRange(i + 1, 3).setValue(`SUCCESS: Added song "${spotifyReturnedSongName}" (by ${spotifyReturnedSongAuthor})`); // Displays in the next adjacent column on the sheet
        added += 1
      }
    } else {
      if (!songName){
        console.log(`[FAIL] No song name provided for row ${i}. If this response has been deleted, this is expected and okay!`);
        sheet.getRange(i + 1, 3).setValue(`skipped`); // Tells the user on the sheet that this row was skipped
        skips += 1
        fails += 1
      }
      else if (row[2]) {
        console.log("[skip] Skipping row " + i + " as it has been found already!")
        skips += 1
      }
    }
  }

  // Console logs will only be visible when running from the Apps Script editor
  console.log(`Execution completed\nIterations: ${attempts}\nSkips: ${skips}\nAdded: ${added}\nFails: ${fails}`);
}

processSongRequests()

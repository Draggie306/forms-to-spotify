# forms-to-spotify

Automatically add Google Forms responses to a Spotify playlist

## Setup

### Basic Setup

Firstly, you'll need to create a new Google Form and, in the "Responses" section, click on "View in Sheets" to either create or link the responses to a Google Sheet.

You'll also need to create or copy a Spotify playlist. Copy the playlist's ID (or in the web view, the part in the URL after `playlist/`)

Then, hop over to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create a new app. 

In the app's settings, copy your **Client ID** and **Client Secret**. In the callback URLs, add a domain you control (note that localhost is not allowed). You can use my own one, `https://www.ibaguette.com` if you don't have a domain.


## Authorisation

You will now need to get a refresh token. To do this, copy and paste the following URL into your browser (replacing `YOUR_CLIENT_ID` with the one in your app!). Also, you should replace `https://www.ibaguette.com` if you're using a different domain. 

```txt
https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=https://www.ibaguette.com&scope=playlist-modify-private%20playlist-modify-public
```

Simply authorise the app, and then you'll be redirected to the `redirect_uri`. In the URL, copy the value of the `code` parameter (everything after `?code=`).

Now, we need to **exchange this code for a refresh token**. 

In addition, we will need to base64 encode your Client ID and Secrets. The format you must convert is `<client_id>:<client_secret>`. Note the colon! Convert this string into a base64 string, we'll use it later!

Open up Postman or run a `curl` command in your terminal. You'll need to:

#### URL
- Send a POST request to `https://accounts.spotify.com/api/token`

#### Headers
- Set the `Content-Type` header to `application/x-www-form-urlencoded`
- Set the `Authorization` header to `Bearer <base64_encoded_client_id_and_secret>` (replace `<base64_encoded_client_id_and_secret>` with the base64 encoded string)

#### Body
- Set the `grant_type` key to have the value `authorization_code`
- Set the `code` key to the value of the code you copied earlier
- Set the `redirect_uri` key to the value of the redirect URI you used earlier

Send!

The response will contain a `refresh_token` key. Copy its value: we'll use it later.

## Scripting

A basic script has been included in this repo. 

Now, we will go back to the Google Sheet and click on `Extensions` -> `Apps Script`.

The script is included in this repo as `code.gs`. Copy and paste the contents of this file into the Apps Script editor. At the top of the file, you'll need to replace the `CLIENT_ID`, `CLIENT_SECRET`, `PLAYLIST_ID` and `REFRESH_TOKEN` with your own values.

In addition, check the `processSongRequests` function. If your form has multiple columns you'll need to change them in this function's iteration from line ~67. Also, most forms will be named "Form responses 1" but if yours is different, you'll need to change this in the `getFormResponses` function.

> If you don't know your form's name use this code to get it:

```javascript
const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
for (let sheet of sheets) {
console.log(sheet.getName());
}
```

The rest of the code should have simple error handling, console logging and comments to help you understand what's happening.

### Triggers

Finally, you need to set up a trigger. To do this, on the left-hand side of the UI, click on "Triggers", then "Add Trigger (bottom right)", then choose to run the function `addSongToPlaylist`, event source as `From spreadsheet`, and event type being `On form submit`. You can also choose to send error notifications immediately, if needed.

## Testing
If everything has been set up correctly, fill in the form and check the playlist! 

It should be immediate but the Spotify UI may take a few seconds to update.

## Issues and Contributing
Open up an issue if you have any problems. I'm happy to help! If you'd like to contribute, feel free to open a pull request.

---

Enjoy!

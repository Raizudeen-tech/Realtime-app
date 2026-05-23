# Realtime Token Display

Plain white screen with a large number in the center. When anyone types a new number, it syncs to Firestore and updates every connected client in realtime. Remote updates speak "token no X" aloud.

## Setup

1. Create a Firebase project and add a Web app.
2. Enable Firestore for the project.
3. Copy the Firebase Web config values into the .env file in the project root.
4. (Demo only) Use open Firestore rules if you want public access while testing.

```txt
rules_version = '2';
service cloud.firestore {
	match /databases/{database}/documents {
		match /{document=**} {
			allow read, write: if true;
		}
	}
}
```

## Run locally

```sh
npm install
npm run dev
```

## Notes

- Data is stored at collection tokens / doc current.
- Speech triggers only for remote updates, not your own edits.
- Browsers often require a user gesture before speech will play; typing once usually enables it.

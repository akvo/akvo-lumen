# Akvo DASH frontend technologies prototype

The purpose of this prototype is to assess and demonstrate the suitability of various front-end components and technologies for use in Akvo DASH.

## How to use

* Perform `npm install` from inside the `dashboard` directory

* Create a file `secrets.js` in the `dashboard` directory. Copy the template below into this file, adding your authentication token:

		const FLOW_AUTH_TOKEN = 'paste the token as a string here'
		export { FLOW_AUTH_TOKEN }


* Run `npm start` and access the prototype on http://localhost:3000

* To load data, Click "Add a new dataset" and enter `https://flowdev1.akvoflow.org/dash/akvoflow-1/_search`
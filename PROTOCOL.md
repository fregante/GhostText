# Client/Server Communication

**Version: 1**

**Client** is defined as the GhostText browser extension.

**Server** is defined as the Editors' plugin or stand alone daemon.

Because this protocol uses WebSockets this document will outline a conversation
between client and server as a series of user interactions.

## User activates editing in the Client

The Client sends an HTTP `GET /` request to `localhost` to the configured port
(default 4001).

```
GET / HTTP/1.1
Host: http://localhost:4001
```

The Server responds with a `200` and a content type of `application/json`.

The JSON payload is an object with the following properties:

| Property          | Type   | Description                          |
| ----------------- | ------ | ------------------------------------ |
| `ProtocolVersion` | Number | The protocol version                 |
| `WebSocketPort`   | Number | The port for the listening WebSocket |

#### Example

```
200 OK
Content-Type: application/json

{
  "ProtocolVersion": 1,
  "WebSocketPort": 12345
}
```

The Client will then establish a new WebSocket connection to
`ws://localhost:12345/` (replace the port number with the one provided in the
previous step).

Once the WebSocket connection is established the Client sends the first message
which is the same as a change message described below.

## User makes a change in the browser

Each time the user makes a change in the browser (or on first WebSocket
connect) the Client sends via the WebSocket a JSON object message with the
following properties:

| Property     | Value                  | Description                                                                                    |
| ------------ | ---------------------- | ---------------------------------------------------------------------------------------------- |
| `title`      | String                 | The title of the document                                                                      |
| `url`        | String                 | The URL of the document                                                                        |
| `syntax`     | String                 | _Not used_                                                                                     |
| `text`       | String                 | The value of the textarea/content                                                              |
| `selections` | Array(SelectionObject) | An array of selection objects that describe the user's current cursor selections in the editor |

#### Selection Object

Selection objects have the following properties:

| Property | Value  | Description                    |
| -------- | ------ | ------------------------------ |
| `start`  | Number | 0-index start of the selection |
| `end`    | Number | 0-index end of the selection   |

#### Example

```json
{
	"title": "Test Document",
	"url": "http://example.com/test-document",
	"syntax": "",
	"text": "Adipisicing excepturi voluptate nostrum quas veritatis?",
	"selections": [
		{
			"start": 10,
			"end": 20
		}
	]
}
```

## User makes a change in the editor

Each time the user makes a change in the editor the Server sends via the
WebSocket a JSON object message with the following properties:

| Property     | Value                  | Description                                                                                    |
| ------------ | ---------------------- | ---------------------------------------------------------------------------------------------- |
| `text`       | String                 | The temporary file content                                                                     |
| `selections` | Array(SelectionObject) | An array of selection objects that describe the user's current cursor selections in the editor |

#### Example

```json
{
	"text": "Adipisicing ea lorem expedita facere nesciunt",
	"selections": [
		{
			"start": 20,
			"end": 30
		}
	]
}
```

## User quits the editor, closes the browser tab, or ends the GhostText session

Either the Server or the Client can just disconnect WebSocket at anytime. In
cases where the user exits the editor it would be prudent for the Server to
send one last change message before disconnecting to prevent possible data
loss.

If the Client disconnects it is up to the Server to choose how to handle things
(typically closing the temporary file or showing a notification to the user).

## Notes

The Server will likely wish to debounce text changes to prevent undue WebSocket
traffic.

In cases of using an external editor that does not support live updates the
exchange can be quite linear:

1.  Server receives a `GET /` request
2.  Server opens a WebSocket
3.  Server responds with JSON describing the WS port number
4.  Client establishes a WS connection to the Server with above port number
5.  Client sends first JSON payload
6.  Server creates temporary file with the content provided in JSON payload
7.  Server spawns editor
8.  Server waits for editor to exist
9.  Server reads temp file
10. Server sends updated JSON payload
11. Server closes WebSocket
12. Server deletes temp file

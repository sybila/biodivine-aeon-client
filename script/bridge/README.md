## Aeon Bridge

Aeon bridge facilitates basic communication between GUI and the compute engine (server). It can operate in two modes: `Http` or `Native` and the mode is determined by `Config.APP_MODE`. In `Http`, the communication is performed using `XMLHttpRequest`, whereas in `Native` mode, requests are handled via the `external` interface (see native [WebView](https://crates.io/crates/web-view) documentation).

### Requests

Each request has a mandatory `path` and `method` (`GET`, `POST`, etc.), plus an optional `arguments` and `body` (only for `POST` requests). In `Http` mode, this translates naturally to a single HTTP request. In `Native` mode, this data is encoded as JSON and passed to the `external` handler. consequently, we assume that:
 - `path` and `body` is always a string;
 - `method` is always one of HTTP methods (`GET`, `POST`, etc.), but can be ignored by the `Native` bridge;
 - `arguments` is an object where each value is a string which will be passed with its particular key.

Each such request is handled asynchronously using a provided callback. We assume that the compute engine always responds with a JSON. The callback thus gets the raw response from the compute engine, but first parses it into a JSON object. Furthermore, unless stated otherwise, we assume each response is an object with the following values:
 - `result` with the data computed by the server for the given request.
 - `error` is an array of objects with two values: `text` and optional `html` which both represent the same user-friendly error string, but `html` can contain additional formatting (for example, list). Extra data (such as error code) can be provided as well in each object.

Both `result` and `error` can be undefined, but we generally assume that when `result` is not defined, `error` is present and is "fatal" (i.e. operation failed in a well-defined way). If both are present, the values in `error` should be treated essentially as warnings (for example, if we import a model that is not compatible but was automatically repaired).

### Notifications

To comunicate new events from the server to the client (for example computation progress), we assume that the server can send "events". In `Http` mode, these are piggy-backed on the `ping` requests which are used to maintain the connection. In `Native` mode, the server can directly notify the `NativeBridge` implementation by invoking a method. 

The client can register an arbitrary number of listeners for various events. Here, a listener is again a callback function, but this time, the response does not have to follow the rules outlined above. Instead, each event should provide its documentation. Ideally, this is done in this file, or in the file of the component which uses the events.

Each event has a unique `name` which is a used to identify interested listeners.
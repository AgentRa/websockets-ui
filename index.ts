import { httpServer } from "./src/http_server";
import {wsServer} from "./src/ws_server";

const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

console.log(`Start ws server on the ${wsServer.options.port} port!`);

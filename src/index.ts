import axios from "axios";
import { v1 as uuid } from "uuid";
import ReconnectingWebSocket from "reconnecting-websocket";
import { IRender, IMotionbox } from "./types";

export * from "./types";

export const SOCKET_URI =
  "wss://c6ifiee5t6.execute-api.us-west-2.amazonaws.com/production";
const DEV_SOCKET_URI =
  "wss://c6ifiee5t6.execute-api.us-west-2.amazonaws.com/development";
const API_ENDPOINT = "https://microservice.motionbox.io/api/motionbox-render";
const DEV_API_ENDPOINT =
  "https://microservice-staging.vercel.app/api/motionbox-render";

// TODO: Keep connection alive with heartbeats
// TODO: Make pointing to a template optional
// TODO: User should be able to render a video from scratch
// TODO: WebSocket will have issues with SSR code i.e next.js
export const motionbox: IMotionbox | undefined =
  typeof window !== "undefined"
    ? {
        renderId: undefined,
        socket: new ReconnectingWebSocket(SOCKET_URI, undefined, {
          debug: true,
        }),
        init: (initOpts) => {
          return new Promise<string>((resolve, reject) => {
            if (motionbox) {
              let interval: NodeJS.Timeout | undefined;
              const { heartbeat, onSocketError, onSocketClose } = initOpts
                ? initOpts
                : {
                    heartbeat: true,
                    onSocketError: () => {},
                    onSocketClose: () => {},
                  };

              // heartbeat
              interval = heartbeat
                ? setInterval(() => {
                    console.log("Sending heartbeat ❤️❤️❤️");
                    motionbox.socket.send("heartbeat");
                  }, 120000)
                : undefined;

              // reconnect?
              console.log("Init triggered...");
              motionbox.socket.reconnect();

              motionbox.socket.onopen = () => {
                console.log(
                  "Socket connection opened ✅ sending default route request to get connectionId..."
                );
                motionbox.socket.send("connectionId");
                resolve("socket opened and connected ✅");
              };

              // socket messages
              motionbox.socket.addEventListener("message", motionbox.onMessage);

              // socket error
              motionbox.socket.onerror = (event: any) => {
                console.error("WebSocket error observed: 🔴", event);
                motionbox.socket.close();

                if (onSocketError) {
                  onSocketError(event);
                }
              };

              // socket closed
              motionbox.socket.onclose = (event: any) => {
                console.log("WebSocket is closed now... ☠️", {
                  event,
                  shouldReconnect: (motionbox.socket as any)._shouldReconnect,
                });

                if ((motionbox.socket as any)._shouldReconnect) {
                  (motionbox.socket as any)._connect();
                } else {
                  interval && clearInterval(interval);
                }

                if (onSocketClose) {
                  onSocketClose(event);
                }
              };

              (window as any).MB = motionbox;
            } else {
              reject("Motionbox is missing...");
            }
          });
        },
        render: async ({
          data,
          token,
          isDev,
          onDone,
          onError,
          progress,
          templateId,
        }: IRender) => {
          return new Promise<string>(async (resolve, reject) => {
            if (motionbox) {
              // set functions
              motionbox.onDone = onDone;
              motionbox.onError = onError;
              motionbox.onProgress = progress;

              // trigger
              try {
                motionbox.renderId = uuid();
                const connectionId = localStorage.getItem("connectionId");

                await axios({
                  method: "post",
                  url: isDev ? DEV_API_ENDPOINT : API_ENDPOINT,
                  data: {
                    data,
                    token,
                    isDev,
                    videoId: motionbox.renderId,
                    templateId: templateId ? templateId : "",
                    connectionId,
                  },
                  headers: {
                    "Content-Type": "application/json",
                  },
                });

                resolve("render request sent");
              } catch (e) {
                reject(`Error triggering render job ${e}`);
              }
            } else {
              reject("Motionbox is undefined...");
            }
          });
        },
        destroy: () => {
          if (motionbox) {
            motionbox.socket.removeEventListener(
              "message",
              motionbox.onMessage
            );
          }
        },
        onDone: () => {},
        onError: () => {},
        onMessage: (event: any) => {
          if (motionbox) {
            const data = JSON.parse(event.data);

            // save connectionId
            if (data?.connectionId) {
              const connectionId = localStorage.getItem("connectionId");

              if (connectionId) {
                console.log(
                  "Socket is sending new connectionId... Overriding old connectionId...",
                  {
                    old: connectionId, // cached on initalization
                    new: data.connectionId,
                  }
                );
              } else {
                console.log("We got an initial connectionId...");
              }

              console.log("Handled connection, lets go!", {
                connecionId: data.connectionId,
              });
              localStorage.setItem("connectionId", data.connectionId);
            }

            // render stream
            if (data?.Data) {
              const hasErrors = data?.Data?.errors;
              let done = false;
              const isDone =
                data.Data?.finalVideo &&
                data.Data?.videoId === motionbox.renderId &&
                !done;
              const total = Number(data.Data?.totalFrames);
              const currentFrame = Number(data.Data?.progress);
              const percentage = currentFrame / total;
              const isProgressing = data.Data?.totalFrames;

              if (hasErrors) {
                return motionbox.onError(data.Data.errors);
              }

              // TODO: log when ffmpeg trim and other pre render things happen

              // progress
              if (isProgressing) {
                motionbox?.onProgress({
                  total,
                  errors: data.Data.errors,
                  message:
                    currentFrame !== total
                      ? "Rendering..."
                      : "Finalizing some details...",
                  percentage,
                  currentFrame,
                });
              }

              // done
              if (isDone) {
                done = true;
                motionbox.onDone(`${data.Data.finalVideo}?t=${Date.now()}`);
              }
            }
          }
        },
        onProgress: () => {},
      }
    : undefined;

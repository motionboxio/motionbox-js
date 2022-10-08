import axios from "axios";
import { v1 as uuid } from "uuid";
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
        socket: new WebSocket(SOCKET_URI),
        init: () => {
          return new Promise<string>((resolve, reject) => {
            if (motionbox) {
              let interval: NodeJS.Timeout | undefined;
              const connectionId = localStorage.getItem("connectionId");

              // heartbeat
              interval = setInterval(() => {
                motionbox.socket.send("heartbeat");
              }, 120000);

              motionbox.socket.onopen = () => {
                motionbox.socket.send("connectionId");
              };

              // connection stream
              const handleConnection = (event: any) => {
                const data = JSON.parse(event.data);

                // save connectionId
                if (data.connectionId) {
                  if (connectionId) {
                    console.log(
                      "Socket is sending new connectionId... Overriding old connectionId..."
                    );
                  } else {
                    console.log("We got an initial connectionId...");
                  }

                  localStorage.setItem("connectionId", data.connectionId);
                  resolve(data.connectionId);
                }
              };

              // socket messages
              motionbox.socket.addEventListener("message", handleConnection);

              // socket error
              motionbox.socket.onerror = (event: any) => {
                console.error("WebSocket error observed:", event);
                interval && clearInterval(interval);
              };

              // socket closed
              motionbox.socket.onclose = (event: any) => {
                console.log("WebSocket is closed now...", { event });
                interval && clearInterval(interval);
              };
            } else {
              reject("Motionbox is missing...");
            }
          });
        },
        render: async ({
          data,
          token,
          isDev,
          progress,
          templateId,
        }: IRender) => {
          return new Promise<string>(async (resolve, reject) => {
            if (motionbox) {
              let fakeFrames = 0;
              const videoId = uuid();
              const connectionId = localStorage.getItem("connectionId");

              const handleStream = async (event: any) => {
                let done = false;
                const data = JSON.parse(event.data);

                // render stream
                if (data?.Data) {
                  const isDone =
                    data.Data?.finalVideo &&
                    data.Data?.videoId === videoId &&
                    !done;
                  const total = Number(data.Data?.totalFrames);
                  const currentFrame = Number(data.Data?.progress);
                  const percentage = currentFrame / total;
                  const isProgressing = data.Data?.totalFrames;

                  // TODO: log when ffmpeg trim and other pre render things happen

                  // progress
                  if (isProgressing) {
                    progress({
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
                    resolve(`${data.Data.finalVideo}?t=${Date.now()}`);
                  }
                }
              };

              // trigger
              try {
                await axios({
                  method: "post",
                  url: isDev ? DEV_API_ENDPOINT : API_ENDPOINT,
                  data: {
                    data,
                    token,
                    isDev,
                    videoId,
                    templateId: templateId ? templateId : "",
                    connectionId,
                  },
                  headers: {
                    "Content-Type": "application/json",
                  },
                });
              } catch (e) {
                reject(`Error triggering render job ${e}`);
              }

              // socket messages
              motionbox.socket.addEventListener("message", handleStream);
            } else {
              reject("Motionbox is undefined...");
            }
          });
        },
      }
    : undefined;

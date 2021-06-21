import axios from "axios";
import { v1 as uuid } from "uuid";
import { IRender } from "./types";

export * from "./types";

export const SOCKET_URI =
  "wss://c6ifiee5t6.execute-api.us-west-2.amazonaws.com/development";

const API_ENDPOINT =
  "https://microservice.storycreatorapp.com/api/motionbox-render";

export const motionbox = {
  socket: new WebSocket(SOCKET_URI),
  init: () => {
    return new Promise<string>((resolve) => {
      motionbox.socket.onopen = () => {
        motionbox.socket.send("connectionId");
      };

      const handleConnection = (event: any) => {
        const data = JSON.parse(event.data);

        // save connectionId
        if (data.connectionId) {
          localStorage.setItem("connectionId", data.connectionId);
          resolve(data.connectionId);
        }
      };

      // socket messages
      motionbox.socket.addEventListener("message", handleConnection);
    });
  },
  render: async ({ data, token, templateId, progress }: IRender) => {
    return new Promise<string>(async (resolve, reject) => {
      const videoId = uuid();
      const connectionId = localStorage.getItem("connectionId");

      const handleStream = async (event: any) => {
        let done = false;
        const { Data } = JSON.parse(event.data);
        const isDone = Data?.finalVideo && Data?.videoId === videoId && !done;
        const isProgressing = Data?.progress && Data?.totalFrames;

        // progress
        if (isProgressing) {
          const percentage =
            (Number(Data.progress) / Number(Data.totalFrames)) * 100;

          progress({
            total: Number(Data.totalFrames),
            message:
              percentage !== 100
                ? "Rendering..."
                : "Finalizing some details...",
            currentFrame: Number(Data.progress),
          });
        }

        // done
        if (isDone) {
          done = true;
          resolve(`${Data.finalVideo}?t=${Date.now()}`);
        }
      };

      // trigger
      try {
        await axios({
          method: "post",
          url: API_ENDPOINT,
          data: {
            data,
            token,
            videoId,
            templateId,
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

      // socket error
      motionbox.socket.onerror = (event: any) => {
        console.error("WebSocket error observed:", event);
      };

      // socket closed
      motionbox.socket.onclose = (event: any) => {
        console.log("WebSocket is closed now.", { event });
      };
    });
  },
};
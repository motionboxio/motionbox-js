import axios from "axios";

interface IRender {
  token: string;
  templateId: string;
}

export const motionbox = {
  render: async ({ token, templateId }: IRender) => {
    // Establish WSS connection
    // ...

    // Trigger render job
    const { status, data } = await axios({
      method: "post",
      url: "http://localhost:3002/api/motionbox-render",
      data: {
        token,
        templateId,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Return render WSS progress to track
    // ...
  },
};

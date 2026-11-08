import axiosClient from "./axiosClient";

export const assistantApi = {
  // messages: [{ role: "user" | "assistant", content: string }]
  chat: (messages) =>
    axiosClient.post(
      "/assistant/chat",
      { messages },
      // Generous: a sleeping free-tier server can take a while to wake up
      { timeout: 60000 },
    ),
};

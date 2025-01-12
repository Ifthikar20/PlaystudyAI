export const plansMap = [
    {
      id: "basic",
      name: "Basic",
      description: "Get started with SpeakEasy!",
      price: "10",
      items: ["3 Blog Posts", "3 Transcription"],
      paymentLink: "https://buy.stripe.com/test_eVa7tgddw0uM25228c",
      priceId:
        process.env.NODE_ENV === "development"
          ? "price_1QYsxVBVyqVzZIJSVo6dmvJw"
          : "",
    },
    {
      id: "pro",
      name: "Pro",
      description: "All Blog Posts, let’s go!",
      price: "14.99",
      items: ["Unlimited Blog Posts", "Unlimited Transcriptions"],
      paymentLink: "https://buy.stripe.com/test_28oaFs8XgcdubFC149",
      priceId:
        process.env.NODE_ENV === "development"
          ? "price_1QZkihBVyqVzZIJSWJSZtsM9"
          : "",
    },
  ];
  
  export const ORIGIN_URL =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://speakeasyai-demo.vercel.app";